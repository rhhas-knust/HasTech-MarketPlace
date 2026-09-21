import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Server-side Supabase client bound to the current request's auth session.
 * Still governed entirely by RLS -- this is the "authenticated" role, not
 * service role. Use this in server components, route handlers and server
 * actions that act on behalf of the signed-in user.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll is called from a Server Component in some cases (e.g. a
          // page render triggered by middleware refreshing the session).
          // Writing cookies there is a no-op; the proxy.ts session refresh
          // already keeps the session cookie current.
        }
      },
    },
  });
}
