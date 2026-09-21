import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import type { Category, Store } from "@/lib/types/database";

export function StoreHeader({
  store,
  categories,
  cartCount,
}: {
  store: Store;
  categories: Category[];
  cartCount: number;
}) {
  return (
    <header className="border-b border-(--color-border) bg-(--color-surface)">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/store/${store.slug}`} className="flex items-center gap-2 min-w-0">
            {store.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--store-accent) text-sm font-semibold text-white">
                {store.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-lg font-semibold text-(--color-ink)">{store.name}</span>
          </Link>

          <div className="flex items-center gap-3">
            <form action={`/store/${store.slug}`} className="hidden sm:block">
              <div className="flex items-center gap-2 rounded-lg border border-(--color-border) px-3 py-1.5">
                <Search className="h-4 w-4 text-(--color-ink-muted)" aria-hidden />
                <input
                  type="search"
                  name="q"
                  placeholder="Search products"
                  className="w-40 bg-transparent text-sm outline-none placeholder:text-(--color-ink-muted)"
                  aria-label="Search products"
                />
              </div>
            </form>
            <Link
              href={`/store/${store.slug}/cart`}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-(--color-border) text-(--color-ink)"
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-(--store-accent) text-xs font-medium text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {categories.length > 0 && (
          <nav className="flex gap-4 overflow-x-auto text-sm text-(--color-ink-muted)">
            <Link href={`/store/${store.slug}`} className="whitespace-nowrap hover:text-(--color-ink)">
              All products
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/store/${store.slug}?category=${category.slug}`}
                className="whitespace-nowrap hover:text-(--color-ink)"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        )}

        <form action={`/store/${store.slug}`} className="sm:hidden">
          <div className="flex items-center gap-2 rounded-lg border border-(--color-border) px-3 py-2">
            <Search className="h-4 w-4 text-(--color-ink-muted)" aria-hidden />
            <input
              type="search"
              name="q"
              placeholder="Search products"
              className="w-full bg-transparent text-sm outline-none placeholder:text-(--color-ink-muted)"
              aria-label="Search products"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
