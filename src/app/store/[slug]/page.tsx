import { notFound } from "next/navigation";
import { getPublishedProducts, getStoreBySlug } from "@/lib/store-data";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ctaLabelForBusinessType } from "@/lib/constants";
import { Package } from "lucide-react";

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
  const cta = ctaLabelForBusinessType(store.business_type);

  return (
    <div>
      {!q && !category && (
        <section className="px-4 pt-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-(--store-accent) px-6 py-14 text-center shadow-lift sm:py-16">
            <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
            <div aria-hidden className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-black/10 blur-2xl" />
            <h1 className="relative text-3xl font-bold tracking-tight text-white sm:text-5xl">{store.name}</h1>
            {store.description && (
              <p className="relative mx-auto mt-3 max-w-xl text-white/85">{store.description}</p>
            )}
            <p className="relative mx-auto mt-6 w-fit rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur">
              {cta} on any product below
            </p>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-4 py-10">
        {featured.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-(--color-ink)">Featured</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} storeSlug={store.slug} product={product} />
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
              {products.map((product) => (
                <ProductCard key={product.id} storeSlug={store.slug} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex justify-center gap-2 text-sm">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}), page: String(p) })}`}
                  className={
                    p === currentPage
                      ? "flex h-9 w-9 items-center justify-center rounded-lg bg-(--store-accent) font-medium text-white"
                      : "flex h-9 w-9 items-center justify-center rounded-lg border border-(--color-border) text-(--color-ink)"
                  }
                >
                  {p}
                </a>
              ))}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
