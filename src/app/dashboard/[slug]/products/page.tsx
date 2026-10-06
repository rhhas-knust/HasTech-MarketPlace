import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Copy, ImageIcon, Package, Pencil, Plus, Search } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreProducts, type DashboardProduct } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/money";
import { isLowStock, isOutOfStock } from "@/lib/inventory";
import { LinkButton, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs, PageHeader } from "@/components/console/ui";
import { cn } from "@/lib/cn";
import { duplicateProductAction } from "./actions";

export const metadata: Metadata = { title: "Products" };

type Tab = "all" | "published" | "draft" | "archived" | "low_stock";

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "low_stock", label: "Low / out of stock" },
  { value: "archived", label: "Archived" },
];

function thumbnail(product: DashboardProduct) {
  const images = [...(product.product_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
  return images[0]?.url ?? null;
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { status, q = "" } = await searchParams;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const tab: Tab = TABS.some((t) => t.value === status) ? (status as Tab) : "all";
  const { products, lowStockThreshold } = await getStoreProducts(membership.store.id, { search: q || undefined });

  const stockAlert = (p: DashboardProduct) => p.status !== "archived" && (isLowStock(p, lowStockThreshold) || isOutOfStock(p));
  const inTab = (p: DashboardProduct, t: Tab) => {
    if (t === "all") return true;
    if (t === "low_stock") return stockAlert(p);
    return p.status === t;
  };
  const visible = products.filter((p) => inTab(p, tab));

  const hrefFor = (next: Tab) => {
    const qs = new URLSearchParams();
    if (next !== "all") qs.set("status", next);
    if (q) qs.set("q", q);
    const s = qs.toString();
    return `/dashboard/${slug}/products${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Catalogue" title="Products" description="Everything you sell, in one place.">
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <form action={`/dashboard/${slug}/products`} className="flex-1 sm:w-64 sm:flex-none">
            {tab !== "all" && <input type="hidden" name="status" value={tab} />}
            <label className="flex items-center gap-2 rounded-md border border-(--color-border) bg-(--color-surface) px-4 py-2.5 transition focus-within:border-(--color-brand) focus-within:ring-4 focus-within:ring-(--color-brand)/15">
              <Search className="h-4 w-4 text-(--color-ink-muted)" aria-hidden />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search products"
                className="w-full bg-transparent text-sm text-(--color-ink) outline-none placeholder:text-(--color-ink-muted)"
                aria-label="Search products"
              />
            </label>
          </form>
          <LinkButton href={`/dashboard/${slug}/products/new`}>
            <Plus className="h-4 w-4" /> New product
          </LinkButton>
        </div>
      </PageHeader>

      <FilterTabs
        tabs={TABS.map((t) => ({
          href: hrefFor(t.value),
          label: t.label,
          count: products.filter((p) => inTab(p, t.value)).length,
          active: tab === t.value,
        }))}
      />

      {products.length === 0 && !q ? (
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title="No products yet"
          description="Add your first product to start selling."
          action={<LinkButton href={`/dashboard/${slug}/products/new`}>Add a product</LinkButton>}
        />
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-(--color-border) bg-(--color-surface)/60 px-6 py-14 text-center text-sm text-(--color-ink-muted)">
          {tab === "low_stock" && !q ? "✅ Everything is well stocked." : "No products match this view."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-surface)">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-(--color-surface-subtle)/70 text-left text-xs uppercase tracking-wider text-(--color-ink-muted)">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Product</th>
                <th className="px-5 py-3.5 font-semibold">Price</th>
                <th className="px-5 py-3.5 font-semibold">Stock</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Views · Sold</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)/70">
              {visible.map((product) => {
                const image = thumbnail(product);
                const out = isOutOfStock(product);
                const low = isLowStock(product, lowStockThreshold);
                return (
                  <tr key={product.id} className="transition-colors hover:bg-(--color-surface-subtle)/60">
                    <td className="max-w-[280px] px-5 py-3">
                      <Link href={`/dashboard/${slug}/products/${product.id}`} className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-(--color-surface-subtle) text-(--color-ink-muted) ring-1 ring-(--color-border)">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <ImageIcon className="h-5 w-5" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-(--color-ink)">{product.name}</span>
                          {product.is_preorder && (
                            <span className="mt-0.5 inline-block">
                              <Badge tone="brand">Pre-order</Badge>
                            </span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 tabular-nums font-semibold text-(--color-ink) tabular-nums">
                      {formatCurrency(product.price, product.currency)}
                    </td>
                    <td className="px-5 py-3">
                      {!product.track_inventory ? (
                        <span className="text-(--color-ink-muted)">Not tracked</span>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
                            out
                              ? "bg-(--color-danger-subtle) text-(--color-danger)"
                              : low
                                ? "bg-(--color-warning-subtle) text-(--color-warning)"
                                : "bg-(--color-surface-subtle) text-(--color-ink)",
                          )}
                        >
                          {out ? "Out of stock" : `${product.stock_quantity} left`}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={product.status === "published" ? "success" : product.status === "draft" ? "neutral" : "warning"}>
                        {product.status === "published" ? "Published" : product.status === "draft" ? "Draft" : "Archived"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-(--color-ink-muted) tabular-nums">
                      {product.view_count} · {product.purchase_count}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/${slug}/products/${product.id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-md border border-(--color-border) bg-(--color-surface) text-(--color-ink-muted) transition-transform hover:text-(--color-ink)"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <form action={duplicateProductAction.bind(null, slug, product.id)}>
                          <Button type="submit" variant="outline" size="sm" className="w-9 px-0" aria-label={`Duplicate ${product.name}`}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
