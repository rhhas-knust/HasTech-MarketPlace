"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { cartCookieName } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics/track";
import type { Cart, CartItem, Product } from "@/lib/types/database";

const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Guest (and logged-in) shopping carts are addressed by an unguessable cart
 * id stored in an httpOnly cookie -- possession of that id IS the
 * authorization, which is why carts/cart_items carry no RLS policy for
 * anon/authenticated (see 0010_rls_policies.sql) and every mutation here
 * goes through the service-role client instead. This keeps checkout usable
 * without forcing account creation (spec: guest checkout is required).
 */
async function getCartId(storeSlug: string): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(cartCookieName(storeSlug))?.value ?? null;
}

async function ensureCart(storeId: string, storeSlug: string): Promise<string> {
  const admin = createAdminClient();
  const cookieStore = await cookies();
  const existingId = await getCartId(storeSlug);

  if (existingId) {
    const { data } = await admin
      .from("carts")
      .select("id")
      .eq("id", existingId)
      .eq("store_id", storeId)
      .eq("status", "active")
      .maybeSingle();
    if (data) return data.id;
  }

  const { data: created, error } = await admin
    .from("carts")
    .insert({ store_id: storeId })
    .select("id")
    .single();
  if (error || !created) throw error ?? new Error("Failed to create cart");

  cookieStore.set(cartCookieName(storeSlug), created.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
  });

  return created.id;
}

export interface CartWithItems {
  cart: Cart | null;
  items: (CartItem & { product: Product | null })[];
  subtotal: number;
}

/** Read-only: safe to call from a server component rendering the cart. */
export async function getCart(storeId: string, storeSlug: string): Promise<CartWithItems> {
  const admin = createAdminClient();
  const cartId = await getCartId(storeSlug);
  if (!cartId) return { cart: null, items: [], subtotal: 0 };

  const { data: cart } = await admin
    .from("carts")
    .select("*")
    .eq("id", cartId)
    .eq("store_id", storeId)
    .eq("status", "active")
    .maybeSingle();
  if (!cart) return { cart: null, items: [], subtotal: 0 };

  const { data: items } = await admin
    .from("cart_items")
    .select("*, product:products(*)")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });

  const rows = (items ?? []) as (CartItem & { product: Product | null })[];
  const subtotal = rows.reduce((sum, row) => sum + row.unit_price * row.quantity, 0);

  return { cart, items: rows, subtotal };
}

export async function addToCart(
  storeId: string,
  storeSlug: string,
  productId: string,
  quantity: number,
): Promise<{ error?: string }> {
  if (quantity < 1) return { error: "Quantity must be at least 1" };

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("store_id", storeId)
    .eq("status", "published")
    .maybeSingle();

  if (!product) return { error: "This product is currently unavailable." };

  const cartId = await ensureCart(storeId, storeSlug);

  const { data: existing } = await admin
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();

  const desiredQuantity = (existing?.quantity ?? 0) + quantity;
  const cappedQuantity = product.track_inventory
    ? Math.min(desiredQuantity, Math.max(product.stock_quantity, 0))
    : desiredQuantity;

  if (product.track_inventory && cappedQuantity <= (existing?.quantity ?? 0)) {
    return { error: "Not enough stock available for this product." };
  }

  const unitPrice = product.sale_price ?? product.price;

  if (existing) {
    await admin.from("cart_items").update({ quantity: cappedQuantity, unit_price: unitPrice }).eq("id", existing.id);
  } else {
    await admin.from("cart_items").insert({
      cart_id: cartId,
      product_id: productId,
      quantity: cappedQuantity,
      unit_price: unitPrice,
    });
  }

  await trackEvent(storeId, "add_to_cart", { productId });
  revalidatePath(`/store/${storeSlug}`, "layout");
  return {};
}

export async function updateCartItemQuantity(
  storeSlug: string,
  cartItemId: string,
  quantity: number,
): Promise<{ error?: string }> {
  const admin = createAdminClient();

  if (quantity < 1) {
    await admin.from("cart_items").delete().eq("id", cartItemId);
    revalidatePath(`/store/${storeSlug}`, "layout");
    return {};
  }

  const { data: item } = await admin
    .from("cart_items")
    .select("id, product:products(stock_quantity, track_inventory)")
    .eq("id", cartItemId)
    .maybeSingle();

  if (!item) return { error: "Item not found in cart." };

  const product = item.product as unknown as { stock_quantity: number; track_inventory: boolean } | null;
  const cappedQuantity = product?.track_inventory
    ? Math.min(quantity, Math.max(product.stock_quantity, 0))
    : quantity;

  await admin.from("cart_items").update({ quantity: cappedQuantity }).eq("id", cartItemId);
  revalidatePath(`/store/${storeSlug}`, "layout");
  return {};
}

export async function removeCartItem(storeSlug: string, cartItemId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("cart_items").delete().eq("id", cartItemId);
  revalidatePath(`/store/${storeSlug}`, "layout");
}

export async function getCartItemCount(storeId: string, storeSlug: string): Promise<number> {
  const { items } = await getCart(storeId, storeSlug);
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
