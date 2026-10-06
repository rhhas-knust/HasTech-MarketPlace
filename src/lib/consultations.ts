"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { consultationSchema } from "@/lib/validation/consultation";

export interface ConsultationFormState {
  error?: string;
  success?: boolean;
}

/**
 * Public "talk to us" form -- no login involved, so this goes through the
 * service-role client after its own validation, the same reasoning as
 * guest checkout (see src/lib/cart.ts): there is no client-facing INSERT
 * policy on consultation_requests at all (0019_founding_member_limit_and_consultations.sql).
 */
export async function submitConsultationRequest(
  _prevState: ConsultationFormState,
  formData: FormData,
): Promise<ConsultationFormState> {
  // Honeypot: a real visitor never sees or fills this field (hidden via CSS
  // in the form), so anything in it means a bot filled every field it found.
  // Report success without writing anything, so the bot doesn't retry.
  if (String(formData.get("website") ?? "").length > 0) {
    return { success: true };
  }

  if (formData.get("acceptPrivacy") !== "on") {
    return { error: "Please agree to the Privacy Policy so we can store your message and reply." };
  }

  const parsed = consultationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    businessName: formData.get("businessName"),
    topic: formData.get("topic"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };

  const admin = createAdminClient();
  const { error } = await admin.from("consultation_requests").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    business_name: parsed.data.businessName || null,
    topic: parsed.data.topic,
    message: parsed.data.message,
    privacy_accepted_at: new Date().toISOString(),
  });
  if (error) return { error: "Something went wrong sending your message. Please try again." };

  return { success: true };
}

export interface ConsultationRequestRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  topic: "how_it_works" | "pricing" | "privacy" | "other";
  message: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

/**
 * Admin-only: requirePlatformAdmin() redirects anyone else before the query
 * even runs. The read itself goes through the regular client -- RLS
 * (consultation_requests_admin_select) grants it, so this is real
 * server-enforced authorization, not just an app-level gate.
 */
export async function getConsultationRequests(): Promise<ConsultationRequestRow[]> {
  await requirePlatformAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("consultation_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function updateConsultationStatus(
  requestId: string,
  status: ConsultationRequestRow["status"],
): Promise<void> {
  await requirePlatformAdmin();
  const supabase = await createClient();
  await supabase.from("consultation_requests").update({ status }).eq("id", requestId);
  revalidatePath("/admin/consultations");
}
