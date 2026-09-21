"use server";

import { revalidatePath } from "next/cache";
import { requireStoreAccess } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function uploadProductImage(
  storeSlug: string,
  productId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file." };
  if (file.size > MAX_FILE_SIZE) return { error: "Images must be 5MB or smaller." };
  if (!ALLOWED_TYPES.has(file.type)) return { error: "Only JPEG, PNG, WEBP or GIF images are allowed." };

  const admin = createAdminClient();

  const { data: product } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", membership.store.id)
    .maybeSingle();
  if (!product) return { error: "Product not found." };

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${membership.store.id}/${productId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { data: publicUrl } = admin.storage.from("product-images").getPublicUrl(path);

  const { count } = await admin
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  await admin.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    url: publicUrl.publicUrl,
    is_primary: (count ?? 0) === 0,
  });

  revalidatePath(`/dashboard/${storeSlug}/products/${productId}`);
  return {};
}

export async function deleteProductImage(storeSlug: string, imageId: string): Promise<void> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return;

  const admin = createAdminClient();
  const { data: image } = await admin
    .from("product_images")
    .select("id, storage_path, product_id, products!inner(store_id)")
    .eq("id", imageId)
    .maybeSingle();

  if (!image || (image.products as unknown as { store_id: string }).store_id !== membership.store.id) return;

  await admin.storage.from("product-images").remove([image.storage_path]);
  await admin.from("product_images").delete().eq("id", imageId);

  revalidatePath(`/dashboard/${storeSlug}/products/${image.product_id}`);
}

export async function setPrimaryProductImage(storeSlug: string, productId: string, imageId: string): Promise<void> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return;

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", membership.store.id)
    .maybeSingle();
  if (!product) return;

  await admin.from("product_images").update({ is_primary: false }).eq("product_id", productId);
  await admin.from("product_images").update({ is_primary: true }).eq("id", imageId);

  revalidatePath(`/dashboard/${storeSlug}/products/${productId}`);
}
