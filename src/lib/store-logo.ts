"use server";

import { revalidatePath } from "next/cache";
import { requireStoreAccess } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const KNOWN_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export async function uploadStoreLogo(storeSlug: string, formData: FormData): Promise<{ error?: string }> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file." };
  if (file.size > MAX_FILE_SIZE) return { error: "Logos must be 2MB or smaller." };
  if (!ALLOWED_TYPES.has(file.type)) return { error: "Only JPEG, PNG or WEBP images are allowed." };

  const admin = createAdminClient();
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  // A fixed filename (not a random UUID, unlike product images) means
  // re-uploading replaces the previous logo instead of accumulating
  // orphaned files every time a seller changes their mind.
  const path = `${membership.store.id}/logo.${extension}`;

  const { error: uploadError } = await admin.storage
    .from("store-logos")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) return { error: "Upload failed. Please try again." };

  // Clean up any stale file left over from a previous upload in a
  // different format (e.g. .png replaced by .jpg) that `upsert` at this
  // new path wouldn't have overwritten.
  const staleExtensions = KNOWN_EXTENSIONS.filter((ext) => ext !== extension);
  if (staleExtensions.length > 0) {
    await admin.storage.from("store-logos").remove(staleExtensions.map((ext) => `${membership.store.id}/logo.${ext}`));
  }

  const { data: publicUrl } = admin.storage.from("store-logos").getPublicUrl(path);
  // Cache-bust so the new logo shows immediately instead of a stale
  // browser/CDN cache of the previous file at the same path.
  const url = `${publicUrl.publicUrl}?v=${Date.now()}`;

  await admin.from("stores").update({ logo_url: url }).eq("id", membership.store.id);
  await logAudit(membership.store.id, membership.store.owner_id, "store.logo_uploaded", "store", membership.store.id);

  revalidatePath(`/dashboard/${storeSlug}/settings`);
  revalidatePath(`/store/${storeSlug}`, "layout");
  return {};
}

export async function removeStoreLogo(storeSlug: string): Promise<void> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return;

  const admin = createAdminClient();
  await admin.from("stores").update({ logo_url: null }).eq("id", membership.store.id);
  await admin.storage
    .from("store-logos")
    .remove(KNOWN_EXTENSIONS.map((ext) => `${membership.store.id}/logo.${ext}`));
  await logAudit(membership.store.id, membership.store.owner_id, "store.logo_removed", "store", membership.store.id);

  revalidatePath(`/dashboard/${storeSlug}/settings`);
  revalidatePath(`/store/${storeSlug}`, "layout");
}
