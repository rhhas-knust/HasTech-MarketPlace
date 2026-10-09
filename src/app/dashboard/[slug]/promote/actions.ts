"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireStoreAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/app-url";
import { logAudit } from "@/lib/audit";
import { SPONSOR_WEEK_OPTIONS } from "@/lib/constants";
import { startSponsorshipPayment } from "@/lib/sponsorships";

export interface PromoteFormState {
  error?: string;
}

export async function buySponsorshipAction(
  storeSlug: string,
  _prev: PromoteFormState,
  formData: FormData,
): Promise<PromoteFormState> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };
  if (!membership.store.published_at) return { error: "Publish your store first, so there's something to send people to." };

  const weeks = Number(formData.get("weeks"));
  if (!(SPONSOR_WEEK_OPTIONS as readonly number[]).includes(weeks)) return { error: "Choose how many weeks." };

  const user = await getCurrentUser();
  if (!user?.email) return { error: "Your account needs an email address to pay." };

  let authorizationUrl: string;
  try {
    const appUrl = await getAppUrl();
    authorizationUrl = await startSponsorshipPayment(
      membership.store.id,
      weeks,
      user.email,
      `${appUrl}/dashboard/${storeSlug}/promote/callback`,
    );
  } catch {
    return { error: "We couldn't start the payment. Please try again in a moment." };
  }

  await logAudit(membership.store.id, user.id, "store.sponsorship_started", "sponsorships", membership.store.id, { weeks });
  redirect(authorizationUrl);
}

export async function setShowSponsoredAction(storeSlug: string, formData: FormData): Promise<void> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return;
  const show = formData.get("showSponsored") === "on";
  const supabase = await createClient();
  await supabase.from("stores").update({ show_sponsored: show }).eq("id", membership.store.id);
  revalidatePath(`/dashboard/${storeSlug}/promote`);
  revalidatePath(`/store/${membership.store.slug}`);
}
