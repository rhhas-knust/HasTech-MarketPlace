import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreBySlug, getStoreCategories } from "@/lib/store-data";
import { getCartItemCount } from "@/lib/cart";
import { StoreHeader } from "@/components/storefront/store-header";
import { StoreFooter } from "@/components/storefront/store-footer";
import { contrastRatio, readableTextOn } from "@/lib/color";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return {};
  return {
    title: { default: store.name, template: `%s | ${store.name}` },
    description: store.description ?? `Shop ${store.name} online.`,
  };
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const [categories, cartCount] = await Promise.all([
    getStoreCategories(store.id),
    getCartItemCount(store.id, store.slug),
  ]);

  const rawAccent = typeof store.theme?.accentColor === "string" ? store.theme.accentColor : undefined;
  const accent = rawAccent && contrastRatio(rawAccent, "#ffffff") !== null ? rawAccent : undefined;
  // Text drawn on the accent must stay readable (WCAG 1.4.3) whatever colour
  // the seller picked.
  const accentStyle = accent
    ? ({
        "--store-accent": accent,
        "--store-accent-hover": accent,
        "--store-on-accent": readableTextOn(accent),
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={accentStyle}
    >
      <StoreHeader store={store} categories={categories} cartCount={cartCount} />
      <main id="main" className="flex-1">{children}</main>
      <StoreFooter store={store} />
    </div>
  );
}
