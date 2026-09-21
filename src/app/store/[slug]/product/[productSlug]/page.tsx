import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts, getStoreBySlug, primaryImage } from "@/lib/store-data";
import { formatCurrency } from "@/lib/money";
import { ctaLabelForBusinessType } from "@/lib/constants";
import { trackProductView } from "@/lib/analytics/track";
import { AddToCartForm } from "@/components/storefront/add-to-cart-form";
import { ShareButtons } from "@/components/storefront/share-buttons";
import { ProductCard } from "@/components/storefront/product-card";
import { Badge } from "@/components/ui/badge";
import { addToCartAction } from "./actions";

async function loadData(slug: string, productSlug: string) {
  const store = await getStoreBySlug(slug);
  if (!store) return null;
  const product = await getProductBySlug(store.id, productSlug);
  if (!product) return null;
  return { store, product };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const data = await loadData(slug, productSlug);
  if (!data) return {};
  const { store, product } = data;
  const image = primaryImage(product);
  const title = product.meta_title || `${product.name} | ${store.name}`;
  const description = product.meta_description || product.description || `${product.name} — available at ${store.name}.`;

  return {
    title: product.meta_title || product.name,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image.url }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;
  const data = await loadData(slug, productSlug);
  if (!data) notFound();
  const { store, product } = data;

  await trackProductView(store.id, product.id);

  const related = await getRelatedProducts(store.id, product.category_id, product.id);
  const image = primaryImage(product);
  const onSale = product.sale_price != null && product.sale_price < product.price;
  const outOfStock = product.track_inventory && product.stock_quantity <= 0;
  const maxQuantity = product.track_inventory ? Math.max(product.stock_quantity, 0) : 99;
  const cta = ctaLabelForBusinessType(store.business_type);
  const boundAddToCart = addToCartAction.bind(null, store.id, store.slug, product.id);

  const productUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/store/${store.slug}/product/${product.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: image ? [image.url] : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: onSale ? product.sale_price : product.price,
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      url: productUrl,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-(--color-surface-subtle)">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt={image.alt_text ?? product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-(--color-ink-muted)">No image</div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-(--color-ink)">{product.name}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-(--color-ink)">
              {formatCurrency(onSale ? product.sale_price! : product.price, product.currency)}
            </span>
            {onSale && (
              <span className="text-(--color-ink-muted) line-through">
                {formatCurrency(product.price, product.currency)}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            {outOfStock ? (
              <Badge tone="neutral">Out of stock</Badge>
            ) : product.track_inventory && product.stock_quantity <= 5 ? (
              <Badge tone="warning">Only {product.stock_quantity} left</Badge>
            ) : (
              <Badge tone="success">In stock</Badge>
            )}
            <span className="text-sm text-(--color-ink-muted)">
              {product.view_count} {product.view_count === 1 ? "person has" : "people have"} viewed this
            </span>
          </div>

          {product.description && (
            <p className="mt-5 whitespace-pre-line text-(--color-ink-muted)">{product.description}</p>
          )}

          <div className="mt-6">
            <AddToCartForm action={boundAddToCart} ctaLabel={cta} maxQuantity={maxQuantity} disabled={outOfStock} />
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-(--color-border) pt-4">
            <span className="text-sm text-(--color-ink-muted)">Share:</span>
            <ShareButtons url={productUrl} title={product.name} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-lg font-semibold text-(--color-ink)">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} storeSlug={store.slug} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
