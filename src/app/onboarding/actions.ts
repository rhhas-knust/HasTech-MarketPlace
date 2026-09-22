"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { storeBusinessInfoSchema, storeContactSchema, storeSlugSchema } from "@/lib/validation/store";
import { DEFAULT_COUNTRY, DEFAULT_CURRENCY, DEFAULT_TIMEZONE } from "@/lib/constants";

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

  const { data: store, error } = await supabase
    .from("stores")
    .insert({
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
    })
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "That store URL is already taken. Try another." };
    return { error: "Something went wrong creating your store. Please try again." };
  }

  redirect(`/dashboard/${store.slug}?welcome=1`);
}
