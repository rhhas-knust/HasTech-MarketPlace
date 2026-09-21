import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY ENTIRELY.
 *
 * This must only ever be used in trusted server-side code that has already
 * performed its own authorisation check (e.g. "does the signed-in user own
 * this store?"), for the specific operations that legitimately need to
 * cross the RLS boundary:
 *   - reading/writing store_payment_credentials (secret keys never reach
 *     any RLS-governed client role, see 0010_rls_policies.sql)
 *   - guest checkout (creating customers/carts/orders with no auth.uid())
 *   - the Paystack webhook handler (no user session at all)
 *
 * The `server-only` import makes accidentally bundling this into client
 * code a build-time error rather than a runtime secret leak.
 */
export function createAdminClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
