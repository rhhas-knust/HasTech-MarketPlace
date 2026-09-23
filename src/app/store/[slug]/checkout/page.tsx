import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStoreBySlug } from "@/lib/store-data";
import { getCart } from "@/lib/cart";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/money";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { submitCheckoutAction } from "./actions";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const cart = await getCart(store.id, store.slug);
  if (cart.items.length === 0) redirect(`/store/${store.slug}/cart`);

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("store_settings")
    .select("delivery_enabled, pickup_enabled, delivery_fee, free_delivery_threshold")
    .eq("store_id", store.id)
    .single();

  const boundAction = submitCheckoutAction.bind(null, store.slug);

  // A cart of only digital/service items needs no physical fulfillment at
  // all -- collapse the delivery-method chooser away entirely rather than
  // asking someone buying an ebook whether they want delivery or pickup.
  const cartNeedsDelivery = cart.items.some((item) => (item.product?.product_type ?? "physical") === "physical");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-(--color-ink)">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm
            action={boundAction}
            deliveryEnabled={cartNeedsDelivery ? (settings?.delivery_enabled ?? true) : false}
            pickupEnabled={cartNeedsDelivery ? (settings?.pickup_enabled ?? true) : true}
          />
        </div>
        <aside className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
          <h2 className="mb-3 font-medium text-(--color-ink)">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="text-(--color-ink-muted)">
                  {item.product?.name} × {item.quantity}
                </span>
                <span className="text-(--color-ink)">
                  {formatCurrency(item.unit_price * item.quantity, store.currency)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-(--color-border) pt-3 font-medium text-(--color-ink)">
            <span>Subtotal</span>
            <span>{formatCurrency(cart.subtotal, store.currency)}</span>
          </div>
          <p className="mt-2 text-xs text-(--color-ink-muted)">
            Delivery fee (if applicable) is calculated when you submit your order.
          </p>
        </aside>
      </div>
    </div>
  );
}
