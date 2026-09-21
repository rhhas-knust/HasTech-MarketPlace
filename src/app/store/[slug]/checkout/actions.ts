"use server";

import { redirect } from "next/navigation";
import { getStoreBySlug } from "@/lib/store-data";
import { getCart } from "@/lib/cart";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createOrderFromCart, EmptyCartError, StockUnavailableError } from "@/lib/orders";
import { initializeOrderPayment } from "@/lib/payments/process";
import { PaymentProviderNotConfiguredError } from "@/lib/payments";
import { trackEvent } from "@/lib/analytics/track";
import { getAppUrl } from "@/lib/app-url";

export interface CheckoutFormState {
  error?: string;
}

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
      return {
        error: "This store hasn't finished setting up payments yet. Please contact the seller directly.",
      };
    }
    throw err;
  }
}
