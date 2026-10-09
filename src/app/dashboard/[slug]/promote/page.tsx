import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Eye, MousePointerClick } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreSponsorships } from "@/lib/sponsorships";
import { readableTextOn } from "@/lib/color";
import { SPONSOR_WEEKLY_PRICE_GHS, SPONSORED_ROW_LIMIT } from "@/lib/constants";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoteForm } from "@/components/dashboard/promote-form";
import { buySponsorshipAction, setShowSponsoredAction } from "./actions";

export const metadata: Metadata = { title: "Promote your store" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" });
}

export default async function PromotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");
  const { store } = membership;

  const sponsorships = await getStoreSponsorships(store.id);
  const active = sponsorships.filter((s) => s.live);
  const runningUntil = active.reduce<string | null>(
    (latest, s) => (!latest || new Date(s.endsAt!) > new Date(latest) ? s.endsAt : latest),
    null,
  );
  const totals = active.reduce((acc, s) => ({ views: acc.views + s.impressions, clicks: acc.clicks + s.clicks }), {
    views: 0,
    clicks: 0,
  });
  const accent = typeof store.theme?.accentColor === "string" ? store.theme.accentColor : "#5b39a8";
  const published = Boolean(store.published_at);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-(--color-ink)">Promote your store</h1>
        <p className="mt-1 max-w-prose text-sm text-(--color-ink-muted)">
          Appear on other HASTECH stores, so their customers discover you. GHS {SPONSOR_WEEKLY_PRICE_GHS} a week.
        </p>
      </div>

      {runningUntil && (
        <Card className="border-(--color-success)/40">
          <CardBody>
            <p className="flex items-center gap-2 font-medium text-(--color-ink)">
              <span aria-hidden className="h-2 w-2 rounded-full bg-(--color-success)" />
              Promoted until {formatDate(runningUntil)}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-(--color-border) p-3">
                <dt className="flex items-center gap-1.5 text-xs text-(--color-ink-muted)">
                  <Eye className="h-3.5 w-3.5" aria-hidden /> Times shown
                </dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-(--color-ink)">{totals.views}</dd>
              </div>
              <div className="rounded-lg border border-(--color-border) p-3">
                <dt className="flex items-center gap-1.5 text-xs text-(--color-ink-muted)">
                  <MousePointerClick className="h-3.5 w-3.5" aria-hidden /> Visits from it
                </dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-(--color-ink)">{totals.clicks}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How it looks</CardTitle>
        </CardHeader>
        <CardBody>
          <div aria-hidden className="rounded-xl border border-dashed border-(--color-border-strong) p-3">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-(--color-ink)">More stores on HASTECH Commerce</span>
              <span className="text-(--color-ink-muted)">Sponsored</span>
            </div>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                style={{ backgroundColor: accent, color: readableTextOn(accent) }}
              >
                {store.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-(--color-ink)">{store.name}</span>
                <span className="block truncate text-xs text-(--color-ink-muted)">
                  {store.description || "Your store description"}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-(--color-ink-muted)" />
            </div>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-(--color-ink-muted)">
            <li>Shown in one slim row below the products on other stores, at most {SPONSORED_ROW_LIMIT} stores at a time.</li>
            <li>Also shown to customers right after they pay, on the order confirmation page.</li>
            <li>Never shown on stores of your own type, so you don&apos;t advertise to a competitor&apos;s customers or the reverse.</li>
            <li>Always labelled &ldquo;Sponsored&rdquo;. Promoted stores take turns in random order.</li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{runningUntil ? "Extend your promotion" : "Start a promotion"}</CardTitle>
        </CardHeader>
        <CardBody>
          {!published && (
            <p className="mb-4 rounded-md bg-(--color-warning-subtle) px-3 py-2 text-sm text-(--color-warning)">
              Publish your store first, so there&apos;s something to send people to.
            </p>
          )}
          <PromoteForm action={buySponsorshipAction.bind(null, slug)} disabled={!published} extending={Boolean(runningUntil)} />
          <p className="mt-3 text-xs text-(--color-ink-muted)">
            Paid to HASTECH Commerce through Paystack. Weeks you buy now start when any current promotion ends. See the{" "}
            <Link href="/refunds#sponsored" className="underline underline-offset-4">
              refund policy
            </Link>
            .
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>On your store</CardTitle>
        </CardHeader>
        <CardBody>
          <form action={setShowSponsoredAction.bind(null, slug)} className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="showSponsored"
                defaultChecked={store.show_sponsored !== false}
                className="mt-0.5 h-4 w-4 accent-(--color-brand)"
              />
              <span>
                <span className="block font-medium text-(--color-ink)">Show sponsored stores on my store</span>
                <span className="block text-(--color-ink-muted)">
                  One row below your products. Never a store of your own type.
                </span>
              </span>
            </label>
            <button
              type="submit"
              className="h-9 rounded-md border border-(--color-border-strong) px-3 text-sm font-medium text-(--color-ink) transition-transform duration-150 hover:bg-(--color-surface-subtle) active:scale-[0.97]"
            >
              Save
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
