import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { logAudit } from "@/lib/audit";

// Self-service account deletion (see 0026_account_deletion.sql).
//
// 1. requestAccountDeletion: owned stores go offline now; erasure is
//    scheduled GRACE_DAYS out. Signing back in and cancelling undoes it.
// 2. purgeAccount (daily cron, once the date passes): personal data is
//    deleted or anonymised. Order amounts, dates and product names stay for
//    the six years tax law requires, with no customer attached to them.
//
// The person's sign-in user and profile are deleted outright. A store's
// order history must stay, so the store is emptied into an anonymous shell
// owned by a locked placeholder account, and its customers are anonymised
// rather than deleted (orders.customer_id is ON DELETE RESTRICT).

export const GRACE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" });
}

async function ownedStoreIds(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("stores").select("id").eq("owner_id", userId);
  return (data ?? []).map((s) => s.id);
}

export async function requestAccountDeletion(userId: string): Promise<{ scheduledFor: string }> {
  const admin = createAdminClient();
  const now = new Date();
  const scheduledFor = new Date(now.getTime() + GRACE_DAYS * DAY_MS).toISOString();

  const { data: profile, error } = await admin
    .from("profiles")
    .update({ deletion_requested_at: now.toISOString(), deletion_scheduled_for: scheduledFor })
    .eq("id", userId)
    .is("deleted_at", null)
    .select("email, full_name")
    .single();
  if (error || !profile) throw new Error("Could not schedule deletion");

  // Take the stores offline straight away; customers shouldn't keep ordering
  // from a seller who is leaving.
  const storeIds = await ownedStoreIds(userId);
  if (storeIds.length > 0) {
    await admin.from("stores").update({ status: "archived", published_at: null }).in("id", storeIds);
    for (const id of storeIds) {
      await logAudit(id, userId, "account.deletion_requested", "profile", userId, { scheduledFor });
    }
  }

  await sendEmail({
    to: profile.email,
    subject: "Your HASTECH Commerce account will be deleted",
    html: `<p>Hi ${profile.full_name ?? "there"},</p>
<p>We received a request to delete your HASTECH Commerce account. Your store is now offline, and your account and its personal data will be permanently deleted on <strong>${formatDate(scheduledFor)}</strong>.</p>
<p>Changed your mind, or didn't ask for this? Sign in before then and choose <strong>Cancel deletion</strong>.</p>
<p>Order amounts and dates are kept for six years, as Ghanaian tax law requires, without any customer names or contact details.</p>`,
  });

  return { scheduledFor };
}

export async function cancelAccountDeletion(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .update({ deletion_requested_at: null, deletion_scheduled_for: null })
    .eq("id", userId)
    .is("deleted_at", null)
    .select("id");
  if (!data || data.length === 0) throw new Error("Nothing to cancel");

  // Back to active but unpublished: the seller decides when to go live again.
  const storeIds = await ownedStoreIds(userId);
  if (storeIds.length > 0) {
    await admin.from("stores").update({ status: "active" }).in("id", storeIds).eq("status", "archived");
    for (const id of storeIds) await logAudit(id, userId, "account.deletion_cancelled", "profile", userId);
  }
}

/** Removes a store's personal data and files, keeping an anonymous shell for its order history. */
async function purgeStore(storeId: string): Promise<void> {
  const admin = createAdminClient();
  const short = storeId.slice(0, 8);

  // Files first, while the rows that point at them still exist.
  const { data: products } = await admin.from("products").select("id, digital_file_path").eq("store_id", storeId);
  const productIds = (products ?? []).map((p) => p.id);
  if (productIds.length > 0) {
    const { data: images } = await admin.from("product_images").select("storage_path").in("product_id", productIds);
    const imagePaths = (images ?? []).map((i) => i.storage_path).filter(Boolean);
    if (imagePaths.length > 0) await admin.storage.from("product-images").remove(imagePaths);
    const filePaths = (products ?? []).map((p) => p.digital_file_path).filter(Boolean) as string[];
    if (filePaths.length > 0) await admin.storage.from("product-files").remove(filePaths);
  }
  await admin.storage
    .from("store-logos")
    .remove(["png", "jpg", "jpeg", "webp"].map((ext) => `${storeId}/logo.${ext}`));

  // Catalogue and carts. order_items keep their own product name and price.
  await admin.from("carts").delete().eq("store_id", storeId);
  await admin.from("products").delete().eq("store_id", storeId);
  await admin.from("categories").delete().eq("store_id", storeId);
  await admin.from("store_payment_credentials").delete().eq("store_id", storeId);
  await admin.from("notifications").delete().eq("store_id", storeId);

  // Customers: drop addresses (unlink orders first) and anonymise the rest.
  await admin.from("orders").update({ delivery_address_id: null, notes: null }).eq("store_id", storeId);
  const { data: customers } = await admin.from("customers").select("id").eq("store_id", storeId);
  for (const c of customers ?? []) {
    await admin.from("customer_addresses").delete().eq("customer_id", c.id);
    await admin
      .from("customers")
      .update({
        email: `deleted-${c.id.slice(0, 8)}@deleted.invalid`,
        phone: null,
        first_name: null,
        last_name: null,
        user_id: null,
        whatsapp_opt_in: false,
      })
      .eq("id", c.id);
  }

  // The store itself becomes an empty, unreachable shell.
  await admin
    .from("stores")
    .update({
      name: "Closed store",
      slug: `closed-${short}-${Date.now().toString(36)}`,
      status: "archived",
      published_at: null,
      description: null,
      logo_url: null,
      cover_image_url: null,
      contact_email: null,
      contact_phone: null,
      whatsapp_number: null,
      address: null,
      city: null,
      region: null,
      refund_policy: null,
      theme: {},
      social_links: {},
      show_sponsored: false,
    })
    .eq("id", storeId);
}

const DELETED_OWNER_EMAIL = "deleted-accounts@hastech-commerce.invalid";

/**
 * One locked placeholder account that owns the empty shells of closed
 * stores, so the real person's sign-in user and profile can be deleted
 * outright (stores.owner_id is ON DELETE RESTRICT).
 */
async function getDeletedOwnerId(): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("profiles").select("id").eq("email", DELETED_OWNER_EMAIL).maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email: DELETED_OWNER_EMAIL,
    email_confirm: true,
    password: randomUUID() + randomUUID(),
    user_metadata: { full_name: "Deleted account" },
    ban_duration: "876000h",
  });
  if (error || !data.user) throw error ?? new Error("Could not create placeholder owner");
  return data.user.id;
}

/**
 * Erases one account. Safe to re-run: every step deletes, overwrites or
 * no-ops, and deleting the auth user (last) is what takes it off the list.
 */
export async function purgeAccount(userId: string): Promise<void> {
  const admin = createAdminClient();
  const storeIds = await ownedStoreIds(userId);

  if (storeIds.length > 0) {
    for (const storeId of storeIds) await purgeStore(storeId);
    const placeholder = await getDeletedOwnerId();
    await admin.from("stores").update({ owner_id: placeholder }).in("id", storeIds);
  }

  // The only other reference that blocks deleting the profile.
  await admin.from("inventory_movements").update({ created_by: null }).eq("created_by", userId);

  // Deleting the auth user removes their Google link and sign-in details,
  // and cascades to the profile, memberships, notifications and feedback.
  // Audit entries and shopper records they made keep a null in its place.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
}

/** Runs every erasure whose 30 days are up. Returns how many accounts were erased. */
export async function processDueDeletions(): Promise<{ erased: number; failed: number }> {
  const admin = createAdminClient();
  const { data: due } = await admin
    .from("profiles")
    .select("id")
    .lte("deletion_scheduled_for", new Date().toISOString())
    .limit(25);

  let erased = 0;
  let failed = 0;
  for (const { id } of due ?? []) {
    try {
      await purgeAccount(id);
      erased++;
    } catch (err) {
      failed++;
      console.error(`[account-deletion] purge failed for ${id}`, err);
    }
  }
  return { erased, failed };
}
