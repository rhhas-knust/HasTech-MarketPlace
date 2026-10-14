import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ImageIcon, Package, Plus, Search } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreProducts, type DashboardProduct } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/money";
import { isLowStock, isOutOfStock } from "@/lib/inventory";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs, PageHeader } from "@/components/console/ui";
import { ProductRowActions } from "@/components/dashboard/product-row-actions";
import { SortSelect } from "@/components/dashboard/sort-select";
import { cn } from "@/lib/cn";
import { deleteProductAction, duplicateProductAction, setProductStatusAction } from "./actions";

export const metadata: Metadata = { title: "Products" };

type Tab = "all" | "published" | "draft" | "archived" | "low_stock";

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "low_stock", label: "Low / out of stock" },
  { value: "archived", label: "Archived" },
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name (A–Z)" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "stock", label: "Stock: lowest first" },
  { value: "best_selling", label: "Best selling" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

const STATUS_BADGE = {
  published: { label: "Published", tone: "success" },
  draft: { label: "Draft", tone: "neutral" },
  archived: { label: "Archived", tone: "warning" },
} as const;

function thumbnail(product: DashboardProduct) {
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return images[0]?.url ?? null;
}

/** What the customer actually pays, so the sort matches the storefront. */
const effectivePrice = (p: DashboardProduct) => Number(p.sale_price ?? p.price);

function sortProducts(products: DashboardProduct[], sort: Sort) {
  const sorted = [...products];
  switch (sort) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "price_asc":
      return sorted.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case "price_desc":
      return sorted.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    case "stock":
      // Untracked stock can't run out, so it goes last.
      return sorted.sort(
        (a, b) =>
          (a.track_inventory ? a.stock_quantity : Infinity) - (b.track_inventory ? b.stock_quantity : Infinity),
      );
    case "best_selling":
      return sorted.sort((a, b) => b.purchase_count - a.purchase_count);
    default:
      return sorted; // already newest first from the query
  }
}

function Price({ product }: { product: DashboardProduct }) {
  const onSale = product.sale_price !== null && product.sale_price !== undefined && Number(product.sale_price) < Number(product.price);
  return (
    <span className="tabular-nums">
      <span className="font-semibold text-(--color-ink)">
        {formatCurrency(onSale ? Number(product.sale_price) : product.price, product.currency)}
      </span>
      {onSale && (
        <span className="ml-1.5 text-xs text-(--color-ink-muted) line-through">
          {formatCurrency(product.price, product.currency)}
        </span>
      )}
    </span>
  );
}

function StockBadge({ product, threshold }: { product: DashboardProduct; threshold: number }) {
  if (!product.track_inventory) return <span className="text-xs text-(--color-ink-muted)">Stock not tracked</span>;
  const out = isOutOfStock(product);
  const low = isLowStock(product, threshold);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        out
          ? "bg-(--color-danger-subtle) text-(--color-danger)"
          : low
            ? "bg-(--color-warning-subtle) text-(--color-warning)"
            : "bg-(--color-surface-subtle) text-(--color-ink)",
      )}
    >
      {out ? (product.is_preorder ? "0 left · pre-order" : "Out of stock") : `${product.stock_quantity} in stock`}
    </span>
  );
}

function Thumb({ src, size = "h-12 w-12" }: { src: string | null; size?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-(--color-surface-subtle) text-(--color-ink-muted) ring-1 ring-(--color-border)",
        size,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <ImageIcon className="h-5 w-5" aria-hidden />
      )}
    </span>
  );
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; q?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const { status, q = "", sort: rawSort } = await searchParams;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const tab: Tab = TABS.some((t) => t.value === status) ? (status as Tab) : "all";
  const sort: Sort = SORTS.some((s) => s.value === rawSort) ? (rawSort as Sort) : "newest";
  const { products, lowStockThreshold } = await getStoreProducts(membership.store.id, { search: q || undefined });
  const storeLive = Boolean(membership.store.published_at) && membership.store.status === "active";

  const stockAlert = (p: DashboardProduct) =>
    p.status !== "archived" && (isLowStock(p, lowStockThreshold) || isOutOfStock(p));
  const inTab = (p: DashboardProduct, t: Tab) => {
    if (t === "all") return true;
    if (t === "low_stock") return stockAlert(p);
    return p.status === t;
  };
  const visible = sortProducts(
    products.filter((p) => inTab(p, tab)),
    sort,
  );

  const hrefFor = (next: Tab) => {
    const qs = new URLSearchParams();
    if (next !== "all") qs.set("status", next);
    if (q) qs.set("q", q);
    if (sort !== "newest") qs.set("sort", sort);
    const s = qs.toString();
    return `/dashboard/${slug}/products${s ? `?${s}` : ""}`;
  };

  const actionsFor = (product: DashboardProduct) => ({
    name: product.name,
    editHref: `/dashboard/${slug}/products/${product.id}`,
    // The storefront only shows published products of a live store.
    previewHref: storeLive && product.status === "published" ? `/store/${membership.store.slug}/product/${product.slug}` : null,
    status: product.status,
    onSetStatus: setProductStatusAction.bind(null, slug, product.id),
    onDuplicate: duplicateProductAction.bind(null, slug, product.id),
    onDelete: deleteProductAction.bind(null, slug, product.id),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description={products.length > 0 ? `${products.length} product${products.length === 1 ? "" : "s"} in your store` : undefined}
      >
        <LinkButton href={`/dashboard/${slug}/products/new`}>
          <Plus className="h-4 w-4" aria-hidden /> Add product
        </LinkButton>
      </PageHeader>

      {products.length === 0 && !q ? (
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title="Add your first product"
          description="Give it a name, a price in cedis and a photo. You can publish it straight away or keep it as a draft."
          action={
            <LinkButton href={`/dashboard/${slug}/products/new`}>
              <Plus className="h-4 w-4" aria-hidden /> Add product
            </LinkButton>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form action={`/dashboard/${slug}/products`} className="sm:w-72">
              {tab !== "all" && <input type="hidden" name="status" value={tab} />}
              {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
              <label className="flex h-10 items-center gap-2 rounded-md border border-(--color-border-strong) bg-(--color-surface) px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--color-brand)">
                <Search className="h-4 w-4 shrink-0 text-(--color-ink-muted)" aria-hidden />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search by name"
                  className="w-full bg-transparent text-sm text-(--color-ink) outline-none placeholder:text-(--color-ink-muted)"
                  aria-label="Search products"
                />
              </label>
            </form>
            <SortSelect options={[...SORTS]} value={sort} />
          </div>

          <FilterTabs
            tabs={TABS.map((t) => ({
              href: hrefFor(t.value),
              label: t.label,
              count: products.filter((p) => inTab(p, t.value)).length,
              active: tab === t.value,
            }))}
          />

          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-(--color-border) bg-(--color-surface)/60 px-6 py-12 text-center text-sm text-(--color-ink-muted)">
              {q ? (
                <>
                  No products match &ldquo;{q}&rdquo;.{" "}
                  <Link href={`/dashboard/${slug}/products`} className="font-medium text-(--color-brand) hover:underline">
                    Clear search
                  </Link>
                </>
              ) : tab === "low_stock" ? (
                "Nothing is low on stock."
              ) : (
                "No products in this view."
              )}
            </div>
          ) : (
            <>
              {/* Phones: one card per product, no sideways scrolling */}
              <ul className="space-y-3 md:hidden">
                {visible.map((product) => (
                  <li key={product.id} className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3">
                    <Link href={`/dashboard/${slug}/products/${product.id}`} className="flex gap-3">
                      <Thumb src={thumbnail(product)} size="h-16 w-16" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="line-clamp-2 font-medium text-(--color-ink)">{product.name}</span>
                          <Badge tone={STATUS_BADGE[product.status].tone}>{STATUS_BADGE[product.status].label}</Badge>
                        </span>
                        <span className="mt-1 block text-sm">
                          <Price product={product} />
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <StockBadge product={product} threshold={lowStockThreshold} />
                          {product.is_preorder && <Badge tone="brand">Pre-order</Badge>}
                        </span>
                      </span>
                    </Link>
                    <ProductRowActions {...actionsFor(product)} className="mt-3 justify-end border-t border-(--color-border) pt-3" />
                  </li>
                ))}
              </ul>

              {/* Tablets and up: a scannable table */}
              <div className="hidden overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) md:block">
                <table className="w-full text-sm">
                  <thead className="bg-(--color-surface-subtle) text-left text-xs font-medium text-(--color-ink-muted)">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Price</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Stock</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                      <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">Views · Sold</th>
                      <th scope="col" className="px-4 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--color-border)">
                    {visible.map((product) => (
                      <tr key={product.id} className="hover:bg-(--color-surface-subtle)/60">
                        <td className="max-w-[18rem] px-4 py-3">
                          <Link href={`/dashboard/${slug}/products/${product.id}`} className="flex items-center gap-3">
                            <Thumb src={thumbnail(product)} />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-(--color-ink)">{product.name}</span>
                              {product.is_preorder && (
                                <span className="mt-0.5 inline-block">
                                  <Badge tone="brand">Pre-order</Badge>
                                </span>
                              )}
                            </span>
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Price product={product} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StockBadge product={product} threshold={lowStockThreshold} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={STATUS_BADGE[product.status].tone}>{STATUS_BADGE[product.status].label}</Badge>
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-3 tabular-nums text-(--color-ink-muted) lg:table-cell">
                          {product.view_count} · {product.purchase_count}
                        </td>
                        <td className="px-4 py-3">
                          <ProductRowActions {...actionsFor(product)} className="justify-end" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
