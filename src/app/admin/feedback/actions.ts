"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/auth/session";

export async function updateFeedbackStatus(
  feedbackId: string,
  status: "open" | "in_progress" | "resolved",
): Promise<void> {
  // RLS (platform_feedback_admin_update) would block this on its own, but
  // this way a non-admin gets redirected cleanly instead of a silent no-op.
  await requirePlatformAdmin();

  const supabase = await createClient();
  await supabase.from("platform_feedback").update({ status }).eq("id", feedbackId);
  revalidatePath("/admin/feedback");
}
