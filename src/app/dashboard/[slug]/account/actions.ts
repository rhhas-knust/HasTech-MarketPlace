"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireStoreAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cancelAccountDeletion, requestAccountDeletion } from "@/lib/account-deletion";

export interface DeleteAccountState {
  error?: string;
}

export async function requestDeletionAction(
  storeSlug: string,
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await requireStoreAccess(storeSlug))) return { error: "Not authorized" };

  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") {
    return { error: 'Type DELETE in the box to confirm.' };
  }
  if (formData.get("understand") !== "on") {
    return { error: "Tick the box to confirm you understand what will be deleted." };
  }

  let scheduledFor: string;
  try {
    ({ scheduledFor } = await requestAccountDeletion(user.id));
  } catch {
    return { error: "We couldn't schedule the deletion. Please try again." };
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/login?deletion=${encodeURIComponent(scheduledFor.slice(0, 10))}`);
}

export async function cancelDeletionAction(storeSlug: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await cancelAccountDeletion(user.id).catch(() => {});
  revalidatePath(`/dashboard/${storeSlug}`, "layout");
  redirect(`/dashboard/${storeSlug}?restored=1`);
}
