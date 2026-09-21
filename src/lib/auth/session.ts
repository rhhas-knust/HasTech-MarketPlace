import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Store, StoreMemberRole } from "@/lib/types/database";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

export interface StoreMembership {
  store: Store;
  role: StoreMemberRole;
}

/** Every store the signed-in user owns or staffs, newest first. */
export async function getUserStores(): Promise<StoreMembership[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("store_members")
    .select("role, stores(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as { role: StoreMemberRole; stores: Store | null }[])
    .filter((row): row is { role: StoreMemberRole; stores: Store } => Boolean(row.stores))
    .map((row) => ({ store: row.stores, role: row.role }));
}

/**
 * Resolves a store by slug and confirms the signed-in user is a member of
 * it (RLS would also block a mismatched fetch, but returning null lets
 * dashboard routes render a clean "not found"/redirect instead of an RLS
 * error).
 */
export async function requireStoreAccess(storeSlug: string): Promise<StoreMembership | null> {
  const memberships = await getUserStores();
  return memberships.find((m) => m.store.slug === storeSlug) ?? null;
}
