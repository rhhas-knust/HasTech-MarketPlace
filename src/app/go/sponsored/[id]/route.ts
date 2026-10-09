import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSponsorEvents, type SponsorPlacement } from "@/lib/sponsorships";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sponsored links pass through here so the click can be counted, then
 * continue to the sponsored store. No cookies, no visitor data: one row
 * saying "a click happened on this placement".
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  if (!UUID.test(id)) return NextResponse.redirect(new URL("/", url), 303);

  const admin = createAdminClient();
  const { data } = await admin
    .from("sponsorships")
    .select("id, status, ends_at, stores!inner(slug)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return NextResponse.redirect(new URL("/", url), 303);

  const slug = (data.stores as unknown as { slug: string }).slug;
  const live = data.status === "active" && data.ends_at && new Date(data.ends_at) > new Date();
  if (live) {
    const placement: SponsorPlacement = url.searchParams.get("p") === "checkout_success" ? "checkout_success" : "storefront";
    const host = url.searchParams.get("from");
    await recordSponsorEvents([id], "click", placement, host && UUID.test(host) ? host : null).catch(() => {});
  }

  return NextResponse.redirect(new URL(`/store/${slug}`, url), 303);
}
