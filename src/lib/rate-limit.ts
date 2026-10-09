import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// Per-IP limits for the public forms that need no sign-in. Attempts are
// counted in Postgres (0027_rate_limits.sql) so the limit holds across every
// serverless instance. Only a hash of the IP is stored.

export const RATE_LIMITS = {
  contact: { limit: 5, windowSeconds: 60 * 60 },
  checkout: { limit: 10, windowSeconds: 10 * 60 },
  orderLookup: { limit: 10, windowSeconds: 15 * 60 },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

export const RATE_LIMITED_MESSAGE = "Too many attempts. Please wait a few minutes and try again.";

async function callerKey(): Promise<string> {
  const h = await headers();
  // Vercel sets x-forwarded-for itself; its first entry is the real client.
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

/**
 * Records one attempt and returns false when the caller is over the limit.
 * Fails open: a database hiccup must not lock real customers out of checkout.
 */
export async function allowRequest(bucket: RateLimitBucket): Promise<boolean> {
  const { limit, windowSeconds } = RATE_LIMITS[bucket];
  try {
    const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
      p_bucket: bucket,
      p_key_hash: await callerKey(),
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data !== false;
  } catch (err) {
    console.error("[rate-limit] check failed, allowing request", err);
    return true;
  }
}
