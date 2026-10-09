import { notFound } from "next/navigation";
import { getPublishedProducts, getStoreBySlug } from "@/lib/store-data";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Package } from "lucide-react";
import { SponsoredStoresRow } from "@/components/storefront/sponsored-stores";

const PAGE_SIZE = 12;

export default async function StoreHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { q, category, page } = await searchParams;

  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const currentPage = Math.max(1, Number(page) || 1);
  const { products, total } = await getPublishedProducts(store.id, {
    search: q,
    categorySlug: category,
    limit: PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
  });

  const featured = !q && !category
    ? (await getPublishedProducts(store.id, { featuredOnly: true, limit: 4 })).products
    : [];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      {!q && !category && (
        <section className="border-b border-(--color-border) bg-(--color-surface)">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
            <span aria-hidden className="progress-fill block h-1 w-12 origin-left rounded-sm bg-(--store-accent)" />
            <h1
              className="enter mt-4 text-3xl font-semibold tracking-tight text-(--color-ink) sm:text-4xl"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              {store.name}
            </h1>
            {store.description && (
              <p className="enter mt-3 max-w-2xl text-(--color-ink-muted)" style={{ "--i": 2 } as React.CSSProperties}>
                {store.description}
              </p>
            )}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10">
        {featured.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-(--color-ink)">Featured</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((product, i) => (
                <ProductCard key={product.id} storeSlug={store.slug} product={product} index={i} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-(--color-ink)">
              {q ? `Results for "${q}"` : category ? "Products" : "All products"}
            </h2>
            <p className="text-sm text-(--color-ink-muted)">{total} item{total === 1 ? "" : "s"}</p>
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="No products found"
              description={q ? "Try a different search term." : "This store hasn't published any products yet."}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product, i) => (
                <ProductCard key={product.id} storeSlug={store.slug} product={product} index={i + featured.length} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex justify-center gap-2 text-sm">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}), page: String(p) })}`}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={
                    p === currentPage
                      ? "flex h-9 w-9 items-center justify-center rounded-lg bg-(--store-accent) font-medium text-(--store-on-accent)"
                      : "flex h-9 w-9 items-center justify-center rounded-lg border border-(--color-border) text-(--color-ink) transition-colors hover:border-(--color-border-strong)"
                  }
                >
                  {p}
                </a>
              ))}
            </nav>
          )}
        </section>

        {store.show_sponsored !== false && !q && (
          <SponsoredStoresRow hostStoreId={store.id} hostBusinessType={store.business_type} />
        )}
      </div>
    </div>
  );
}
