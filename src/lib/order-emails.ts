import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail, newOrderAlertEmail } from "@/lib/email-templates";
import { getAppUrl } from "@/lib/app-url";

interface OrderForEmail {
  order_number: string;
  total: number;
  currency: string;
  customers: { email: string; first_name: string; last_name: string } | null;
  order_items: { product_name: string; quantity: number }[];
}

interface StoreForEmail {
  name: string;
  slug: string;
  profiles: { full_name: string | null; email: string } | null;
}

/**
 * Fires the order-confirmation (customer) and new-order-alert (seller)
 * emails. Called once from verifyAndProcessPayment right after an order is
 * marked paid -- that call site is already guarded by the payment_events
 * idempotency check, so this only ever runs once per order regardless of
 * whether the webhook or the checkout success page wins the race to get
 * there first.
 *
 * Every failure mode here (missing email, missing RESEND_API_KEY, a Resend
 * error) is swallowed by sendEmail itself -- this function never throws,
 * so a seller still gets their order recorded and a customer still gets
 * their payment confirmed even if not a single email goes out.
 */
export async function sendOrderPaidEmails(storeId: string, orderId: string): Promise<void> {
  const admin = createAdminClient();

  const [{ data: order }, { data: store }] = await Promise.all([
    admin
      .from("orders")
      .select("order_number, total, currency, customers(email, first_name, last_name), order_items(product_name, quantity)")
      .eq("id", orderId)
      .maybeSingle(),
    admin
      .from("stores")
      .select("name, slug, profiles!stores_owner_id_fkey(full_name, email)")
      .eq("id", storeId)
      .maybeSingle(),
  ]);

  if (!order || !store) return;

  const typedOrder = order as unknown as OrderForEmail;
  const typedStore = store as unknown as StoreForEmail;
  const items = typedOrder.order_items.map((item) => ({ name: item.product_name, quantity: item.quantity }));
  const appUrl = await getAppUrl();

  const customer = typedOrder.customers;
  if (customer?.email) {
    const { subject, html } = orderConfirmationEmail({
      customerName: customer.first_name || "there",
      orderNumber: typedOrder.order_number,
      storeName: typedStore.name,
      items,
      total: typedOrder.total,
      currency: typedOrder.currency,
      trackOrderUrl: `${appUrl}/store/${typedStore.slug}/order?number=${typedOrder.order_number}`,
    });
    await sendEmail({ to: customer.email, subject, html });
  }

  const owner = typedStore.profiles;
  if (owner?.email) {
    const customerName = customer ? `${customer.first_name} ${customer.last_name}`.trim() : "A customer";
    const { subject, html } = newOrderAlertEmail({
      sellerName: owner.full_name || "there",
      orderNumber: typedOrder.order_number,
      storeName: typedStore.name,
      customerName,
      items,
      total: typedOrder.total,
      currency: typedOrder.currency,
      dashboardUrl: `${appUrl}/dashboard/${typedStore.slug}/orders`,
    });
    await sendEmail({ to: owner.email, subject, html });
  }
}
