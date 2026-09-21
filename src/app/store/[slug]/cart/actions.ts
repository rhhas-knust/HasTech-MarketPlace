"use server";

import { removeCartItem, updateCartItemQuantity } from "@/lib/cart";

export async function updateQuantityAction(storeSlug: string, formData: FormData) {
  const cartItemId = String(formData.get("cartItemId"));
  const quantity = Number(formData.get("quantity"));
  await updateCartItemQuantity(storeSlug, cartItemId, quantity);
}

export async function removeItemAction(storeSlug: string, formData: FormData) {
  const cartItemId = String(formData.get("cartItemId"));
  await removeCartItem(storeSlug, cartItemId);
}
