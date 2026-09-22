"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStoreAccess, getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface FeedbackFormState {
  error?: string;
  success?: boolean;
}

const feedbackSchema = z.object({
  category: z.enum(["bug", "feature_request", "question", "other"]),
  message: z.string().trim().min(5, "Tell us a bit more (at least 5 characters)").max(4000),
});

export async function submitFeedbackAction(
  storeSlug: string,
  _prevState: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized" };

  const parsed = feedbackSchema.safeParse({
    category: formData.get("category"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("platform_feedback").insert({
    user_id: user.id,
    store_id: membership.store.id,
    category: parsed.data.category,
    message: parsed.data.message,
  });
  if (error) return { error: "Could not submit feedback. Please try again." };

  revalidatePath(`/dashboard/${storeSlug}/feedback`);
  return { success: true };
}
