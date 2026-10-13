"use server";

import { redirect } from "next/navigation";
import { getStoreBySlug } from "@/lib/store-data";
import { getCart } from "@/lib/cart";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createOrderFromCart, EmptyCartError, StockUnavailableError } from "@/lib/orders";
import { initializeOrderPayment } from "@/lib/payments/process";
import { isPaymentProviderConfigured, PaymentProviderNotConfiguredError } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackEvent } from "@/lib/analytics/track";
import { getAppUrl } from "@/lib/app-url";
import { allowRequest, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";

export interface CheckoutFormState {
  error?: string;
}

const NOT_ACCEPTING_PAYMENTS =
  "This store hasn't finished setting up payments yet. Please contact the seller directly.";

export async function submitCheckoutAction(
  storeSlug: string,
  _prevState: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const store = await getStoreBySlug(storeSlug);
  if (!store) return { error: "Store not found." };

  const parsed = checkoutSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    deliveryMethod: formData.get("deliveryMethod"),
    addressLine: formData.get("addressLine"),
    city: formData.get("city"),
    region: formData.get("region"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };

  // Each attempt creates an order and a Paystack transaction.
  if (!(await allowRequest("checkout"))) return { error: RATE_LIMITED_MESSAGE };

  // Check before creating anything: an order the shopper can't pay for is
  // just noise for the seller, and creating it would empty their cart.
  if (!(await isPaymentProviderConfigured(store.id))) return { error: NOT_ACCEPTING_PAYMENTS };

  const cart = await getCart(store.id, store.slug);

  let order;
  try {
    order = await createOrderFromCart(store.id, cart, parsed.data);
  } catch (err) {
    if (err instanceof EmptyCartError) return { error: "Your cart is empty." };
    if (err instanceof StockUnavailableError) {
      return { error: `${err.productName} no longer has enough stock. Please update your cart.` };
    }
    return { error: "Something went wrong creating your order. Please try again." };
  }

  await trackEvent(store.id, "checkout_started", { orderId: order.orderId });

  const appUrl = await getAppUrl();
  try {
    await trackEvent(store.id, "payment_started", { orderId: order.orderId });
    const { authorizationUrl } = await initializeOrderPayment(
      store.id,
      order.orderId,
      parsed.data.email,
      `${appUrl}/store/${store.slug}/checkout/success?order=${order.orderId}`,
    );
    redirect(authorizationUrl);
  } catch (err) {
    if (err instanceof PaymentProviderNotConfiguredError) {
      return { error: NOT_ACCEPTING_PAYMENTS };
    }
    throw err;
  }
}

/**
 * "Try again" after a failed or abandoned payment: starts a new Paystack
 * transaction for the SAME unpaid order (its cart was already converted, so
 * sending the shopper back to the cart would show it empty). Holding the
 * payment reference is the authorisation -- the same thing that lets them
 * see the confirmation page -- and the order must still be unpaid.
 */
export async function retryPaymentAction(storeSlug: string, reference: string): Promise<void> {
  const back: (reason: string) => never = (reason) =>
    redirect(`/store/${storeSlug}/checkout/success?reference=${encodeURIComponent(reference)}&retry=${reason}`);

  if (!(await allowRequest("checkout"))) back("limited");

  const store = await getStoreBySlug(storeSlug);
  if (!store) back("unavailable");

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("order_id")
    .eq("store_id", store.id)
    .eq("reference", reference)
    .maybeSingle();
  if (!payment) back("unavailable");

  const { data: order } = await admin
    .from("orders")
    .select("id, payment_status, fulfilment_status, customers(email), order_items(quantity, products(name, track_inventory, is_preorder, stock_quantity))")
    .eq("id", payment.order_id)
    .eq("store_id", store.id)
    .maybeSingle();
  if (!order) back("unavailable");
  if (order.payment_status === "paid") redirect(`/store/${storeSlug}/checkout/success?reference=${encodeURIComponent(reference)}`);
  if (order.payment_status !== "pending" && order.payment_status !== "failed") back("unavailable");
  // The seller may have cancelled an unpaid order in the meantime.
  if (order.fulfilment_status === "cancelled" || order.fulfilment_status === "refunded") back("unavailable");

  // Stock is only taken when an order is paid, so it may have sold out since.
  const items = (order.order_items ?? []) as unknown as {
    quantity: number;
    products: { track_inventory: boolean; is_preorder: boolean; stock_quantity: number } | null;
  }[];
  const soldOut = items.some(
    (item) => item.products?.track_inventory && !item.products.is_preorder && item.products.stock_quantity < item.quantity,
  );
  if (soldOut) back("stock");

  const email = (order.customers as unknown as { email: string | null } | null)?.email;
  if (!email || !(await isPaymentProviderConfigured(store.id))) back("unavailable");

  const appUrl = await getAppUrl();
  let authorizationUrl: string | null = null;
  try {
    ({ authorizationUrl } = await initializeOrderPayment(
      store.id,
      order.id,
      email,
      `${appUrl}/store/${store.slug}/checkout/success?order=${order.id}`,
    ));
  } catch (err) {
    console.error("[checkout] retry payment failed", err);
  }
  if (!authorizationUrl) back("unavailable");
  await trackEvent(store.id, "payment_started", { orderId: order.id });
  redirect(authorizationUrl);
}
