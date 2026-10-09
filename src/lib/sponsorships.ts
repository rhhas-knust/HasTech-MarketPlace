import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformPaymentProvider } from "@/lib/payments/platform";
import { fromMinorUnits, toMinorUnits } from "@/lib/money";
import { DEFAULT_CURRENCY, SPONSOR_WEEKLY_PRICE_GHS, SPONSORED_ROW_LIMIT } from "@/lib/constants";
import type { BusinessType } from "@/lib/types/database";

// Sponsored placements: a store pays (to HASTECH's own Paystack account) to be
// shown on OTHER stores for a number of weeks. Everything here runs on the
// server with the service role: sellers only ever read their own purchases
// (RLS in 0024_sponsorships.sql); buying, activating and counting go through
// these functions after their own checks.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type SponsorPlacement = "storefront" | "checkout_success";

export interface SponsoredStore {
  sponsorshipId: string;
  storeId: string;
  slug: string;
  name: string;
  description: string | null;
  businessType: BusinessType;
  logoUrl: string | null;
  accentColor: string | null;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Stores with a running sponsorship, in random order so every sponsor gets a
 * fair share of the few slots. Never the host store itself, and never a store
 * of the same business type: a bookshop shouldn't advertise its competitor.
 */
export async function getSponsoredStores(options: {
  hostStoreId: string;
  hostBusinessType?: BusinessType;
  limit?: number;
}): Promise<SponsoredStore[]> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("sponsorships")
    .select(
      "id, store_id, stores!inner(id, slug, name, description, business_type, logo_url, theme, status, published_at)",
    )
    .eq("status", "active")
    .lte("starts_at", now)
    .gt("ends_at", now)
    .neq("store_id", options.hostStoreId)
    .eq("stores.status", "active")
    .not("stores.published_at", "is", null)
    .limit(50);
  if (error || !data) return [];

  const seen = new Set<string>();
  const stores: SponsoredStore[] = [];
  for (const row of data) {
    const store = row.stores as unknown as {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      business_type: BusinessType;
      logo_url: string | null;
      theme: Record<string, unknown> | null;
    };
    if (seen.has(store.id)) continue;
    if (options.hostBusinessType && store.business_type === options.hostBusinessType) continue;
    seen.add(store.id);
    stores.push({
      sponsorshipId: row.id,
      storeId: store.id,
      slug: store.slug,
      name: store.name,
      description: store.description,
      businessType: store.business_type,
      logoUrl: store.logo_url,
      accentColor: typeof store.theme?.accentColor === "string" ? store.theme.accentColor : null,
    });
  }
  return shuffle(stores).slice(0, options.limit ?? SPONSORED_ROW_LIMIT);
}

/** Append-only counting. Failures are swallowed: a missed count must never break a page. */
export async function recordSponsorEvents(
  sponsorshipIds: string[],
  kind: "impression" | "click",
  placement: SponsorPlacement,
  hostStoreId: string | null,
): Promise<void> {
  if (sponsorshipIds.length === 0) return;
  const admin = createAdminClient();
  await admin
    .from("sponsor_events")
    .insert(sponsorshipIds.map((id) => ({ sponsorship_id: id, kind, placement, host_store_id: hostStoreId })));
}

export interface SponsorshipSummary {
  id: string;
  status: "pending" | "active" | "failed" | "cancelled";
  weeks: number;
  amount: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  impressions: number;
  clicks: number;
  /** Paid and its window hasn't ended (it may not have started yet). */
  live: boolean;
}

/** A store's purchases, newest first, with view and click counts. */
export async function getStoreSponsorships(storeId: string): Promise<SponsorshipSummary[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("sponsorships")
    .select("id, status, weeks, amount, starts_at, ends_at, created_at")
    .eq("store_id", storeId)
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false })
    .limit(20);
  if (!data || data.length === 0) return [];

  const ids = data.map((s) => s.id);
  const { data: events } = await admin.from("sponsor_events").select("sponsorship_id, kind").in("sponsorship_id", ids);
  const counts = new Map<string, { impressions: number; clicks: number }>();
  for (const e of events ?? []) {
    const c = counts.get(e.sponsorship_id) ?? { impressions: 0, clicks: 0 };
    if (e.kind === "impression") c.impressions++;
    else c.clicks++;
    counts.set(e.sponsorship_id, c);
  }

  return data
    // A pending row older than a day is an abandoned checkout, not a purchase.
    .filter((s) => s.status === "active" || Date.now() - new Date(s.created_at).getTime() < 24 * 60 * 60 * 1000)
    .map((s) => ({
      id: s.id,
      status: s.status,
      weeks: s.weeks,
      amount: Number(s.amount),
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      createdAt: s.created_at,
      impressions: counts.get(s.id)?.impressions ?? 0,
      clicks: counts.get(s.id)?.clicks ?? 0,
      live: s.status === "active" && Boolean(s.ends_at) && new Date(s.ends_at).getTime() > Date.now(),
    }));
}

export function sponsorshipPrice(weeks: number): number {
  return weeks * SPONSOR_WEEKLY_PRICE_GHS;
}

export function isSponsorshipReference(reference: string): boolean {
  return reference.startsWith("SPN-");
}

/** Creates the pending purchase and returns Paystack's checkout URL. */
export async function startSponsorshipPayment(
  storeId: string,
  weeks: number,
  email: string,
  callbackUrl: string,
): Promise<string> {
  const amount = sponsorshipPrice(weeks);
  const reference = `SPN-${storeId.slice(0, 8)}-${Date.now().toString(36)}`;
  const admin = createAdminClient();

  const { error } = await admin.from("sponsorships").insert({
    store_id: storeId,
    status: "pending",
    weeks,
    amount,
    currency: DEFAULT_CURRENCY,
    reference,
  });
  if (error) throw error;

  const result = await getPlatformPaymentProvider().initializeTransaction({
    email,
    amountMinorUnits: toMinorUnits(amount),
    currency: DEFAULT_CURRENCY,
    reference,
    callbackUrl,
    metadata: { store_id: storeId, kind: "sponsorship" },
  });
  return result.authorizationUrl;
}

/**
 * Turns a paid reference into a running sponsorship. Safe to call twice
 * (Paystack webhook and the callback page both do): only a still-pending row
 * changes. A new purchase starts when the store's current one ends, so
 * buying again extends rather than overlaps.
 */
export async function verifyAndProcessSponsorshipPayment(
  storeId: string,
  reference: string,
): Promise<{ status: "success" | "failed" | "already_processed"; endsAt: string | null }> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("sponsorships")
    .select("id, store_id, status, weeks, amount, currency, ends_at")
    .eq("store_id", storeId)
    .eq("reference", reference)
    .maybeSingle();
  if (!row) throw new Error(`No sponsorship for reference ${reference}`);
  if (row.status !== "pending") return { status: "already_processed", endsAt: row.ends_at };

  const verification = await getPlatformPaymentProvider().verifyTransaction(reference);
  const paid =
    verification.status === "success" &&
    Math.abs(fromMinorUnits(verification.amountMinorUnits) - Number(row.amount)) < 0.01 &&
    verification.currency === row.currency;

  if (!paid) {
    await admin
      .from("sponsorships")
      .update({ status: "failed", raw_response: verification.raw })
      .eq("id", row.id)
      .eq("status", "pending");
    return { status: "failed", endsAt: null };
  }

  const { data: running } = await admin
    .from("sponsorships")
    .select("ends_at")
    .eq("store_id", storeId)
    .eq("status", "active")
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = running?.ends_at ? new Date(running.ends_at) : new Date();
  const end = new Date(start.getTime() + row.weeks * WEEK_MS);

  const { data: updated } = await admin
    .from("sponsorships")
    .update({
      status: "active",
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      raw_response: verification.raw,
    })
    .eq("id", row.id)
    .eq("status", "pending")
    .select("id");
  if (!updated || updated.length === 0) return { status: "already_processed", endsAt: null };

  return { status: "success", endsAt: end.toISOString() };
}
