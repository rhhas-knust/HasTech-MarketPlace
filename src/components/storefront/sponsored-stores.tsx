import { ArrowUpRight } from "lucide-react";
import { getSponsoredStores, recordSponsorEvents, type SponsoredStore, type SponsorPlacement } from "@/lib/sponsorships";
import { readableTextOn } from "@/lib/color";
import { BUSINESS_TYPE_OPTIONS } from "@/lib/constants";
import type { BusinessType } from "@/lib/types/database";

function href(store: SponsoredStore, placement: SponsorPlacement, hostStoreId: string) {
  return `/go/sponsored/${store.sponsorshipId}?p=${placement}&from=${hostStoreId}`;
}

function categoryLabel(type: BusinessType) {
  const label = BUSINESS_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Store";
  return label.split(" /")[0];
}

function StoreMark({ store, size = 40 }: { store: SponsoredStore; size?: number }) {
  if (store.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={store.logoUrl} alt="" width={size} height={size} className="shrink-0 rounded-lg object-cover" style={{ width: size, height: size }} />;
  }
  const bg = store.accentColor ?? "#5b39a8";
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
      style={{ width: size, height: size, backgroundColor: bg, color: readableTextOn(bg) }}
    >
      {store.name.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * The one slim "Sponsored" row a storefront may show, below its own products.
 * Renders nothing when the seller switched it off or no sponsor fits.
 */
export async function SponsoredStoresRow({
  hostStoreId,
  hostBusinessType,
}: {
  hostStoreId: string;
  hostBusinessType: BusinessType;
}) {
  const stores = await getSponsoredStores({ hostStoreId, hostBusinessType });
  if (stores.length === 0) return null;
  await recordSponsorEvents(
    stores.map((s) => s.sponsorshipId),
    "impression",
    "storefront",
    hostStoreId,
  ).catch(() => {});
  return <SponsoredStoresRowView stores={stores} hostStoreId={hostStoreId} />;
}

export function SponsoredStoresRowView({ stores, hostStoreId }: { stores: SponsoredStore[]; hostStoreId: string }) {
  return (
    <section aria-labelledby="sponsored-heading" className="mt-14 border-t border-(--color-border) pt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="sponsored-heading" className="text-sm font-medium text-(--color-ink)">
          More stores on HASTECH Commerce
        </h2>
        <span className="text-xs text-(--color-ink-muted)">Sponsored</span>
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {stores.map((store) => (
          <li key={store.sponsorshipId}>
            <a
              href={href(store, "storefront", hostStoreId)}
              className="lift group flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
            >
              <StoreMark store={store} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-(--color-ink)">{store.name}</span>
                <span className="block truncate text-xs text-(--color-ink-muted)">
                  {store.description || categoryLabel(store.businessType)}
                </span>
              </span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-(--color-ink-muted) transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** After a successful payment: a compact strip of other stores, by category. */
export async function SponsoredCategoryStrip({
  hostStoreId,
  hostBusinessType,
}: {
  hostStoreId: string;
  hostBusinessType: BusinessType;
}) {
  const stores = await getSponsoredStores({ hostStoreId, hostBusinessType, limit: 4 });
  if (stores.length === 0) return null;
  await recordSponsorEvents(
    stores.map((s) => s.sponsorshipId),
    "impression",
    "checkout_success",
    hostStoreId,
  ).catch(() => {});
  return <SponsoredCategoryStripView stores={stores} hostStoreId={hostStoreId} />;
}

export function SponsoredCategoryStripView({ stores, hostStoreId }: { stores: SponsoredStore[]; hostStoreId: string }) {
  return (
    <section aria-labelledby="discover-heading" className="mt-10 text-left">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="discover-heading" className="text-sm font-medium text-(--color-ink)">
          Discover more stores
        </h2>
        <span className="text-xs text-(--color-ink-muted)">Sponsored</span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {stores.map((store) => (
          <li key={store.sponsorshipId}>
            <a
              href={href(store, "checkout_success", hostStoreId)}
              className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface) py-1.5 pr-3 pl-1.5 text-sm transition-colors hover:border-(--color-border-strong)"
            >
              <StoreMark store={store} size={24} />
              <span className="text-(--color-ink-muted)">{categoryLabel(store.businessType)}:</span>
              <span className="font-medium text-(--color-ink)">{store.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
