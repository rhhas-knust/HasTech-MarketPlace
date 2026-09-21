"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreAccess } from "@/lib/auth/session";
import { productSchema } from "@/lib/validation/product";
import { slugify } from "@/lib/slug";
import { logAudit } from "@/lib/audit";

export interface ProductFormState {
  error?: string;
}

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId") || null,
    sku: formData.get("sku"),
    price: Number(formData.get("price")),
    salePrice: formData.get("salePrice") ? Number(formData.get("salePrice")) : null,
    trackInventory: formData.get("trackInventory") === "on",
    stockQuantity: Number(formData.get("stockQuantity") || 0),
    lowStockThreshold: formData.get("lowStockThreshold") ? Number(formData.get("lowStockThreshold")) : null,
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
  });
}

export async function createProductAction(
  storeSlug: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your input." };

  const supabase = await createClient();
  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let suffix = 1;
  // Small retry loop rather than a pre-check -- the unique (store_id, slug)
  // constraint is the real guard against a race between two concurrent creates.
  let productId: string | null = null;
  let lastError: { code?: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("products")
      .insert({
        store_id: membership.store.id,
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        category_id: parsed.data.categoryId || null,
        sku: parsed.data.sku || null,
        price: parsed.data.price,
        sale_price: parsed.data.salePrice,
        track_inventory: parsed.data.trackInventory,
        stock_quantity: parsed.data.stockQuantity,
        low_stock_threshold: parsed.data.lowStockThreshold,
        status: parsed.data.status,
        featured: parsed.data.featured,
        published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (!error) {
      productId = data.id;
      break;
    }
    lastError = error;
    if (error.code !== "23505") break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  if (!productId) {
    return { error: lastError ? "Could not create product. Please try again." : "Unknown error" };
  }

  await logAudit(membership.store.id, membership.store.owner_id, "product.created", "product", productId, {
    name: parsed.data.name,
  });

  redirect(`/dashboard/${storeSlug}/products/${productId}`);
}

export async function updateProductAction(
  storeSlug: string,
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your input." };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("products")
    .select("status, published_at")
    .eq("id", productId)
    .eq("store_id", membership.store.id)
    .single();

  const nowPublishing = parsed.data.status === "published" && current?.status !== "published";

  const { error } = await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      category_id: parsed.data.categoryId || null,
      sku: parsed.data.sku || null,
      price: parsed.data.price,
      sale_price: parsed.data.salePrice,
      track_inventory: parsed.data.trackInventory,
      stock_quantity: parsed.data.stockQuantity,
      low_stock_threshold: parsed.data.lowStockThreshold,
      status: parsed.data.status,
      featured: parsed.data.featured,
      published_at: nowPublishing ? new Date().toISOString() : current?.published_at,
    })
    .eq("id", productId)
    .eq("store_id", membership.store.id);

  if (error) return { error: "Could not save changes. Please try again." };

  await logAudit(membership.store.id, membership.store.owner_id, "product.updated", "product", productId);
  revalidatePath(`/dashboard/${storeSlug}/products`);
  revalidatePath(`/dashboard/${storeSlug}/products/${productId}`);
  return {};
}

export async function deleteProductAction(storeSlug: string, productId: string): Promise<void> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return;

  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", productId).eq("store_id", membership.store.id);

  await logAudit(membership.store.id, membership.store.owner_id, "product.deleted", "product", productId);
  revalidatePath(`/dashboard/${storeSlug}/products`);
  redirect(`/dashboard/${storeSlug}/products`);
}

export async function duplicateProductAction(storeSlug: string, productId: string): Promise<void> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return;

  const supabase = await createClient();
  const { data: original } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("store_id", membership.store.id)
    .single();
  if (!original) return;

  const baseSlug = `${original.slug}-copy`;
  await supabase.from("products").insert({
    store_id: membership.store.id,
    name: `${original.name} (Copy)`,
    slug: baseSlug,
    description: original.description,
    category_id: original.category_id,
    product_type: original.product_type,
    sku: null,
    price: original.price,
    sale_price: original.sale_price,
    track_inventory: original.track_inventory,
    stock_quantity: 0,
    low_stock_threshold: original.low_stock_threshold,
    status: "draft",
    featured: false,
  });

  await logAudit(membership.store.id, membership.store.owner_id, "product.duplicated", "product", productId);
  revalidatePath(`/dashboard/${storeSlug}/products`);
}
