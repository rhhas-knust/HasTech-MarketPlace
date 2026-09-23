"use server";

import { revalidatePath } from "next/cache";
import { requireStoreAccess } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Checked by extension, not the browser-reported MIME type: niche formats
// like .psd/.ai are frequently reported as application/octet-stream (or
// nothing at all) depending on OS and browser, so trusting `file.type`
// would reject exactly the files sellers most want to upload.
const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "epub",
  "mobi",
  "zip",
  "psd",
  "ai",
  "eps",
  "svg",
  "fig",
  "docx",
  "pptx",
  "xlsx",
  "csv",
  "mp3",
  "mp4",
  "wav",
]);

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

/**
 * Attaches (or replaces) the one downloadable file for a product -- an
 * ebook, a design file, a zipped bundle, whatever the seller is actually
 * selling. Stored in the private `product-files` bucket (see
 * 0018_product_digital_files.sql), which has no client-facing storage
 * policies at all: only this service-role-backed action can write to it,
 * and only src/lib/digital-downloads.ts can read from it, after confirming
 * a paid order.
 */
export async function uploadDigitalFile(
  storeSlug: string,
  productId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file." };
  if (file.size > MAX_FILE_SIZE) return { error: "Files must be 20MB or smaller." };

  const extension = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return {
      error: "That file type isn't supported. Try a PDF, EPUB, ZIP, PSD, AI, or a common office/media format.",
    };
  }

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, digital_file_path")
    .eq("id", productId)
    .eq("store_id", membership.store.id)
    .maybeSingle();
  if (!product) return { error: "Product not found." };

  // Fixed path (not a random one), like the store logo -- re-uploading
  // replaces the previous file instead of accumulating orphaned objects.
  const path = `${membership.store.id}/${productId}/file.${extension}`;

  const { error: uploadError } = await admin.storage
    .from("product-files")
    .upload(path, file, { upsert: true });
  if (uploadError) return { error: "Upload failed. Please try again." };

  // Clean up a stale file left at a different extension from a previous
  // upload (upsert at this new path wouldn't have overwritten it).
  if (product.digital_file_path && product.digital_file_path !== path) {
    await admin.storage.from("product-files").remove([product.digital_file_path]);
  }

  await admin
    .from("products")
    .update({ digital_file_path: path, digital_file_name: file.name, digital_file_size: file.size })
    .eq("id", productId);

  await logAudit(
    membership.store.id,
    membership.store.owner_id,
    "product.digital_file_uploaded",
    "product",
    productId,
  );
  revalidatePath(`/dashboard/${storeSlug}/products/${productId}`);
  return {};
}

export async function removeDigitalFile(storeSlug: string, productId: string): Promise<void> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return;

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("digital_file_path")
    .eq("id", productId)
    .eq("store_id", membership.store.id)
    .maybeSingle();
  if (!product) return;

  if (product.digital_file_path) {
    await admin.storage.from("product-files").remove([product.digital_file_path]);
  }

  await admin
    .from("products")
    .update({ digital_file_path: null, digital_file_name: null, digital_file_size: null })
    .eq("id", productId);

  await logAudit(
    membership.store.id,
    membership.store.owner_id,
    "product.digital_file_removed",
    "product",
    productId,
  );
  revalidatePath(`/dashboard/${storeSlug}/products/${productId}`);
}
