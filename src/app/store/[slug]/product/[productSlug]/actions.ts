"use server";

import { addToCart } from "@/lib/cart";

export interface AddToCartState {
  error?: string;
  success?: boolean;
}

export async function addToCartAction(
  storeId: string,
  storeSlug: string,
  productId: string,
  _prevState: AddToCartState,
  formData: FormData,
): Promise<AddToCartState> {
  const quantity = Number(formData.get("quantity") ?? 1);
  const result = await addToCart(storeId, storeSlug, productId, quantity);
  if (result.error) return { error: result.error };
  return { success: true };
}
