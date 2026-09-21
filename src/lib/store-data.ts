import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product, ProductImage, Store } from "@/lib/types/database";

/**
 * Public storefront reads. All of these go through the regular
 * (RLS-governed) server client rather than the admin client -- the
 * `_public_read` policies on stores/categories/products/product_images
 * already restrict results to active stores and published products, so
 * there is nothing extra to enforce here.
 */
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function getStoreCategories(storeId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export type ProductWithImages = Product & { product_images: ProductImage[] };

export async function getPublishedProducts(
  storeId: string,
  options: { categorySlug?: string; search?: string; featuredOnly?: boolean; limit?: number; offset?: number } = {},
): Promise<{ products: ProductWithImages[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*, product_images(*)", { count: "exact" })
    .eq("store_id", storeId)
    .eq("status", "published");

  if (options.featuredOnly) query = query.eq("featured", true);
  if (options.search) query = query.ilike("name", `%${options.search}%`);
  if (options.categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("store_id", storeId)
      .eq("slug", options.categorySlug)
      .maybeSingle();
    if (category) query = query.eq("category_id", category.id);
    else return { products: [], total: 0 };
  }

  const limit = options.limit ?? 12;
  const offset = options.offset ?? 0;
  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, count } = await query;
  return { products: (data as ProductWithImages[]) ?? [], total: count ?? 0 };
}

export async function getProductBySlug(
  storeId: string,
  productSlug: string,
): Promise<ProductWithImages | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("store_id", storeId)
    .eq("slug", productSlug)
    .eq("status", "published")
    .maybeSingle();
  return data as ProductWithImages | null;
}

export async function getRelatedProducts(
  storeId: string,
  categoryId: string | null,
  excludeProductId: string,
  limit = 4,
): Promise<ProductWithImages[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("store_id", storeId)
    .eq("status", "published")
    .neq("id", excludeProductId)
    .limit(limit);

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data } = await query;
  return (data as ProductWithImages[]) ?? [];
}

export function primaryImage(product: { product_images: ProductImage[] }): ProductImage | null {
  if (!product.product_images?.length) return null;
  return product.product_images.find((img) => img.is_primary) ?? product.product_images[0];
}
