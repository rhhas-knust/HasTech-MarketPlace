"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStoreAccess } from "@/lib/auth/session";
import { storeBusinessInfoSchema, storeContactSchema, storeSettingsSchema, paystackCredentialsSchema } from "@/lib/validation/store";
import { logAudit } from "@/lib/audit";

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

export async function updateStoreInfoAction(
  storeSlug: string,
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const businessInfo = storeBusinessInfoSchema.safeParse({
    name: formData.get("name"),
    businessType: formData.get("businessType"),
    description: formData.get("description"),
  });
  if (!businessInfo.success) return { error: businessInfo.error.issues[0]?.message };

  const contact = storeContactSchema.safeParse({
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    whatsappNumber: formData.get("whatsappNumber"),
    address: formData.get("address"),
    city: formData.get("city"),
    region: formData.get("region"),
  });
  if (!contact.success) return { error: contact.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("stores")
    .update({
      name: businessInfo.data.name,
      business_type: businessInfo.data.businessType,
      description: businessInfo.data.description || null,
      contact_email: contact.data.contactEmail || null,
      contact_phone: contact.data.contactPhone || null,
      whatsapp_number: contact.data.whatsappNumber || null,
      address: contact.data.address || null,
      city: contact.data.city || null,
      region: contact.data.region || null,
    })
    .eq("id", membership.store.id);
  if (error) return { error: "Could not save changes." };

  await logAudit(membership.store.id, membership.store.owner_id, "store.settings_changed", "store", membership.store.id);
  revalidatePath(`/dashboard/${storeSlug}/settings`);
  return { success: true };
}

export async function updateDeliverySettingsAction(
  storeSlug: string,
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const parsed = storeSettingsSchema.safeParse({
    deliveryEnabled: formData.get("deliveryEnabled") === "on",
    pickupEnabled: formData.get("pickupEnabled") === "on",
    deliveryFee: Number(formData.get("deliveryFee") || 0),
    freeDeliveryThreshold: formData.get("freeDeliveryThreshold")
      ? Number(formData.get("freeDeliveryThreshold"))
      : null,
    deliveryNotes: formData.get("deliveryNotes"),
    lowStockThreshold: Number(formData.get("lowStockThreshold") || 5),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!parsed.data.deliveryEnabled && !parsed.data.pickupEnabled) {
    return { error: "Enable at least one fulfilment method (delivery or pickup)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("store_settings")
    .update({
      delivery_enabled: parsed.data.deliveryEnabled,
      pickup_enabled: parsed.data.pickupEnabled,
      delivery_fee: parsed.data.deliveryFee,
      free_delivery_threshold: parsed.data.freeDeliveryThreshold,
      delivery_notes: parsed.data.deliveryNotes || null,
      low_stock_threshold: parsed.data.lowStockThreshold,
    })
    .eq("store_id", membership.store.id);
  if (error) return { error: "Could not save changes." };

  await logAudit(membership.store.id, membership.store.owner_id, "store.settings_changed", "store_settings", membership.store.id);
  revalidatePath(`/dashboard/${storeSlug}/settings`);
  return { success: true };
}

export async function updatePaymentCredentialsAction(
  storeSlug: string,
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const parsed = paystackCredentialsSchema.safeParse({
    publicKey: formData.get("publicKey"),
    secretKey: formData.get("secretKey"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  // Deliberately the admin client: store_payment_credentials has no
  // client-facing RLS policy at all (see 0010_rls_policies.sql). The
  // authorization check is the requireStoreAccess() call above, done in
  // trusted server code -- the secret key itself never reaches the browser.
  const admin = createAdminClient();
  const { error } = await admin.from("store_payment_credentials").upsert({
    store_id: membership.store.id,
    provider: "paystack",
    public_key: parsed.data.publicKey,
    secret_key: parsed.data.secretKey,
  });
  if (error) return { error: "Could not save payment settings." };

  await logAudit(membership.store.id, membership.store.owner_id, "store.payment_settings_changed", "store", membership.store.id);
  revalidatePath(`/dashboard/${storeSlug}/settings/payments`);
  return { success: true };
}
