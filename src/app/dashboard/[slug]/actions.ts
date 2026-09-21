"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreAccess } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export async function publishStoreAction(storeSlug: string): Promise<{ error?: string }> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("stores")
    .update({ published_at: new Date().toISOString() })
    .eq("id", membership.store.id);
  if (error) return { error: "Could not publish your store. Please try again." };

  await logAudit(membership.store.id, membership.store.owner_id, "store.published", "store", membership.store.id);
  revalidatePath(`/dashboard/${storeSlug}`);
  return {};
}

export async function unpublishStoreAction(storeSlug: string): Promise<{ error?: string }> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("stores").update({ published_at: null }).eq("id", membership.store.id);
  if (error) return { error: "Could not unpublish your store." };

  await logAudit(membership.store.id, membership.store.owner_id, "store.unpublished", "store", membership.store.id);
  revalidatePath(`/dashboard/${storeSlug}`);
  return {};
}
