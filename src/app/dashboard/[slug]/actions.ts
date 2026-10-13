"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreAccess } from "@/lib/auth/session";
import { isPaymentProviderConfigured } from "@/lib/payments";
import { logAudit } from "@/lib/audit";

export async function publishStoreAction(storeSlug: string): Promise<{ error?: string }> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  // Real readiness, read from the database: a live store must be able to
  // take payment and have something to sell. Unpublishing is never blocked.
  const supabase = await createClient();
  const [paymentsReady, { count: publishedProducts }] = await Promise.all([
    isPaymentProviderConfigured(membership.store.id),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", membership.store.id)
      .eq("status", "published"),
  ]);
  if (!paymentsReady) {
    return { error: "Connect your Paystack account first, so customers can pay you. Go to Settings → Payments." };
  }
  if (!publishedProducts) {
    return { error: "Publish at least one product first, so customers have something to buy." };
  }

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
