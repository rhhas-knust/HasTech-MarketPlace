"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Browser-side Supabase client. Uses the anon key only -- every table it can
 * reach is governed by RLS (see supabase/migrations/0010_rls_policies.sql).
 * Never import the service-role client from client code.
 */
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
