import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Package, Copy, Pencil } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreProducts } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/money";
import { LinkButton, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import type { ProductStatus } from "@/lib/types/database";
import { duplicateProductAction } from "./actions";

export const metadata: Metadata = { title: "Products" };

const TABS: { value: ProductStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { status, q } = await searchParams;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const products = await getStoreProducts(membership.store.id, {
    status: status && status !== "all" ? (status as ProductStatus) : undefined,
    search: q,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-(--color-ink)">Products</h1>
        <LinkButton href={`/dashboard/${slug}/products/new`}>New product</LinkButton>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 rounded-lg border border-(--color-border) p-1">
          {TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/dashboard/${slug}/products${tab.value === "all" ? "" : `?status=${tab.value}`}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                (status ?? "all") === tab.value
                  ? "bg-(--color-brand-subtle) text-(--color-brand)"
                  : "text-(--color-ink-muted) hover:text-(--color-ink)",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <form className="flex items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search products"
            className="h-9 rounded-lg border border-(--color-border) px-3 text-sm"
          />
        </form>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No products yet"
          description="Add your first product to start selling."
          action={<LinkButton href={`/dashboard/${slug}/products/new`} variant="store">Add a product</LinkButton>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-surface)">
          <table className="w-full text-sm">
            <thead className="border-b border-(--color-border) text-left text-(--color-ink-muted)">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="max-w-[220px] px-4 py-3 font-medium text-(--color-ink)">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{product.name}</span>
                      {product.is_preorder && (
                        <span className="shrink-0">
                          <Badge tone="brand">Pre-order</Badge>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-(--color-ink)">{formatCurrency(product.price, product.currency)}</td>
                  <td className="px-4 py-3">
                    {product.track_inventory ? (
                      <span
                        className={
                          product.stock_quantity <= (product.low_stock_threshold ?? 5)
                            ? "text-(--color-warning)"
                            : "text-(--color-ink)"
                        }
                      >
                        {product.stock_quantity}
                      </span>
                    ) : (
                      <span className="text-(--color-ink-muted)">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={product.status === "published" ? "success" : product.status === "draft" ? "neutral" : "warning"}
                    >
                      {product.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-(--color-ink-muted)">{product.view_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/${slug}/products/${product.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-(--color-border) text-(--color-ink-muted) hover:text-(--color-ink)"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <form action={duplicateProductAction.bind(null, slug, product.id)}>
                        <Button type="submit" variant="outline" size="sm" aria-label="Duplicate">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
