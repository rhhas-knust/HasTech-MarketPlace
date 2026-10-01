import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { FOUNDING_MEMBER_LIMIT } from "@/lib/constants";

/** Remaining founding-member slots, or null if the count can't be read. */
export async function getFoundingSpotsLeft(): Promise<number | null> {
  try {
    const { count, error } = await createAdminClient()
      .from("platform_billing")
      .select("store_id", { count: "exact", head: true })
      .eq("is_founding_member", true);
    if (error || count === null) return null;
    return Math.max(0, FOUNDING_MEMBER_LIMIT - count);
  } catch {
    return null;
  }
}
