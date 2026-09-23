import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeOrderTotals, resolveDeliveryFee } from "@/lib/money";
import type { CheckoutInput } from "@/lib/validation/checkout";
import type { CartWithItems } from "@/lib/cart";

export class EmptyCartError extends Error {
  constructor() {
    super("Your cart is empty");
    this.name = "EmptyCartError";
  }
}

export class StockUnavailableError extends Error {
  constructor(public readonly productName: string) {
    super(`${productName} no longer has enough stock`);
    this.name = "StockUnavailableError";
  }
}

/**
 * Creates the order + order_items from a server-loaded cart. Every price
 * used here is re-read from `products` (or the cart_items snapshot, which
 * itself was only ever set server-side in src/lib/cart.ts) -- nothing about
 * the total is taken from client input, satisfying the "never trust
 * price/total from the frontend" requirement.
 */
export async function createOrderFromCart(
  storeId: string,
  cart: CartWithItems,
  checkout: CheckoutInput,
): Promise<{ orderId: string; orderNumber: string; total: number; currency: string }> {
  if (!cart.cart || cart.items.length === 0) throw new EmptyCartError();

  const admin = createAdminClient();

  const { data: store } = await admin
    .from("stores")
    .select("currency")
    .eq("id", storeId)
    .single();

  const { data: settings } = await admin
    .from("store_settings")
    .select("delivery_fee, free_delivery_threshold")
    .eq("store_id", storeId)
    .single();

  // Re-validate stock at the moment of order creation (a second, cheap
  // safety net on top of the check in addToCart -- concurrent checkouts on
  // the last unit are a known, documented limitation; see README).
  for (const item of cart.items) {
    if (!item.product) throw new StockUnavailableError("A product in your cart");
    if (
      item.product.track_inventory &&
      !item.product.is_preorder &&
      item.product.stock_quantity < item.quantity
    ) {
      throw new StockUnavailableError(item.product.name);
    }
  }

  const lines = cart.items.map((item) => ({ unitPrice: item.unit_price, quantity: item.quantity }));
  const subtotalOnly = computeOrderTotals(lines).subtotal;
  const deliveryFee = resolveDeliveryFee(subtotalOnly, checkout.deliveryMethod, {
    deliveryFee: settings?.delivery_fee ?? 0,
    freeDeliveryThreshold: settings?.free_delivery_threshold ?? null,
  });
  const totals = computeOrderTotals(lines, { deliveryFee });

  const { data: customer, error: customerError } = await admin
    .from("customers")
    .upsert(
      {
        store_id: storeId,
        email: checkout.email.toLowerCase(),
        phone: checkout.phone,
        first_name: checkout.firstName,
        last_name: checkout.lastName,
      },
      { onConflict: "store_id,email", ignoreDuplicates: false },
    )
    .select("id")
    .single();
  if (customerError || !customer) throw customerError ?? new Error("Failed to create customer");

  let deliveryAddressId: string | null = null;
  if (checkout.deliveryMethod === "delivery" && checkout.addressLine) {
    const { data: address } = await admin
      .from("customer_addresses")
      .insert({
        customer_id: customer.id,
        address_line: checkout.addressLine,
        city: checkout.city || null,
        region: checkout.region || null,
      })
      .select("id")
      .single();
    deliveryAddressId = address?.id ?? null;
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      store_id: storeId,
      customer_id: customer.id,
      subtotal: totals.subtotal,
      delivery_fee: totals.deliveryFee,
      discount: totals.discount,
      total: totals.total,
      currency: store?.currency ?? "GHS",
      delivery_method: checkout.deliveryMethod,
      delivery_address_id: deliveryAddressId,
      notes: checkout.notes || null,
    })
    .select("id, order_number")
    .single();
  if (orderError || !order) throw orderError ?? new Error("Failed to create order");

  const orderItems = cart.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product?.name ?? "Product",
    unit_price: item.unit_price,
    quantity: item.quantity,
    line_total: Math.round(item.unit_price * item.quantity * 100) / 100,
    is_preorder: item.product?.is_preorder ?? false,
  }));
  await admin.from("order_items").insert(orderItems);

  await admin.from("carts").update({ status: "converted" }).eq("id", cart.cart.id);

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    total: totals.total,
    currency: store?.currency ?? "GHS",
  };
}

export async function getOrderForTracking(storeId: string, orderNumber: string, email: string) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*, order_items(*), customers!inner(email)")
    .eq("store_id", storeId)
    .eq("order_number", orderNumber)
    .ilike("customers.email", email.trim())
    .maybeSingle();
  return order;
}
