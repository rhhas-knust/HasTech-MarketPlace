"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  storeBrandingSchema,
  storeBusinessInfoSchema,
  storeContactSchema,
  storeSlugSchema,
} from "@/lib/validation/store";
import { DEFAULT_COUNTRY, DEFAULT_CURRENCY, DEFAULT_TIMEZONE } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import type { BusinessType, ProductType } from "@/lib/types/database";

export interface OnboardingFormState {
  error?: string;
}

export async function createStoreAction(
  _prevState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const businessInfo = storeBusinessInfoSchema.safeParse({
    name: formData.get("name"),
    businessType: formData.get("businessType"),
    description: formData.get("description"),
  });
  if (!businessInfo.success) return { error: businessInfo.error.issues[0]?.message };

  const slugResult = storeSlugSchema.safeParse(formData.get("slug"));
  if (!slugResult.success) return { error: slugResult.error.issues[0]?.message };

  const contact = storeContactSchema.safeParse({
    contactEmail: formData.get("contactEmail") ?? "",
    contactPhone: formData.get("contactPhone") ?? "",
    whatsappNumber: formData.get("whatsappNumber") ?? "",
    address: formData.get("address") ?? "",
    city: formData.get("city") ?? "",
    region: formData.get("region") ?? "",
  });
  if (!contact.success) return { error: contact.error.issues[0]?.message };

  const branding = storeBrandingSchema.safeParse({ accentColor: formData.get("accentColor") ?? "" });

  // No .select() here: Postgres re-checks a SELECT policy against the row
  // returned by INSERT ... RETURNING, and that happens before the
  // on_store_created trigger's insert into store_members is visible (see
  // 0003_profiles_and_stores.sql) -- so a plain owner, who isn't a member
  // of anything yet, would fail RLS reading back the very row they just
  // created. We already have the slug from the validated form input, so
  // there's nothing to read back anyway.
  const { error } = await supabase.from("stores").insert({
    owner_id: user!.id,
    name: businessInfo.data.name,
    business_type: businessInfo.data.businessType,
    description: businessInfo.data.description || null,
    slug: slugResult.data,
    contact_email: contact.data.contactEmail || user!.email,
    contact_phone: contact.data.contactPhone || null,
    whatsapp_number: contact.data.whatsappNumber || null,
    address: contact.data.address || null,
    city: contact.data.city || null,
    region: contact.data.region || null,
    country: DEFAULT_COUNTRY,
    currency: DEFAULT_CURRENCY,
    timezone: DEFAULT_TIMEZONE,
    ...(branding.success ? { theme: { accentColor: branding.data.accentColor } } : {}),
  });

  if (error) {
    if (error.code === "23505") return { error: "That store URL is already taken. Try another." };
    return { error: "Something went wrong creating your store. Please try again." };
  }

  await createFirstProductFromDraft(supabase, slugResult.data, businessInfo.data.businessType, formData);

  redirect(`/dashboard/${slugResult.data}?welcome=1`);
}

const PRODUCT_TYPE_FOR_BUSINESS: Partial<Record<BusinessType, ProductType>> = {
  service: "service",
  professional_service: "service",
  digital_product: "digital",
};

const draftProductSchema = z.object({
  name: z.string().trim().min(1).max(120),
  price: z.coerce.number().min(0).max(1_000_000),
});

/**
 * Best-effort: the store already exists at this point, so a failure here
 * must never block onboarding -- the seller can always add the product
 * from their dashboard instead.
 */
async function createFirstProductFromDraft(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storeSlug: string,
  businessType: BusinessType,
  formData: FormData,
) {
  const parsed = draftProductSchema.safeParse({
    name: formData.get("productName") ?? "",
    price: formData.get("productPrice") || undefined,
  });
  if (!parsed.success) return;

  // A separate read (not INSERT ... RETURNING) so the on_store_created
  // trigger's store_members row is visible to the SELECT policy by now.
  const { data: store } = await supabase.from("stores").select("id").eq("slug", storeSlug).maybeSingle();
  if (!store) return;

  const { error } = await supabase.from("products").insert({
    store_id: store.id,
    name: parsed.data.name,
    slug: slugify(parsed.data.name) || "first-product",
    product_type: PRODUCT_TYPE_FOR_BUSINESS[businessType] ?? "physical",
    price: parsed.data.price,
    track_inventory: false,
    status: "published",
    published_at: new Date().toISOString(),
  });
  if (error) console.error("[onboarding] first product from draft failed", error);
}
