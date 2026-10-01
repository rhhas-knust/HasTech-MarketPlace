import Link from "next/link";
import { formatCurrency } from "@/lib/money";
import { isOutOfStock } from "@/lib/inventory";
import { primaryImage, type ProductWithImages } from "@/lib/store-data";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ storeSlug, product }: { storeSlug: string; product: ProductWithImages }) {
  const image = primaryImage(product);
  const onSale = product.sale_price != null && product.sale_price < product.price;
  const outOfStock = isOutOfStock(product);

  return (
    <Link
      href={`/store/${storeSlug}/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-(--color-border)/70 bg-(--color-surface) p-2 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-(--color-surface-subtle)">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt_text ?? product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-(--color-ink-muted)">
            No image
          </div>
        )}
        {product.is_preorder ? (
          <span className="absolute left-2.5 top-2.5">
            <Badge tone="brand">Pre-order</Badge>
          </span>
        ) : outOfStock ? (
          <span className="absolute left-2.5 top-2.5">
            <Badge tone="neutral">Out of stock</Badge>
          </span>
        ) : (
          product.featured && (
            <span className="absolute left-2.5 top-2.5">
              <Badge tone="brand">Featured</Badge>
            </span>
          )
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-2.5 pb-2 pt-3">
        <p className="line-clamp-2 text-sm font-medium text-(--color-ink)">{product.name}</p>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="rounded-full bg-(--color-surface-subtle) px-2.5 py-0.5 font-mono text-sm font-semibold text-(--color-ink)">
            {formatCurrency(onSale ? product.sale_price! : product.price, product.currency)}
          </span>
          {onSale && (
            <span className="text-sm text-(--color-ink-muted) line-through">
              {formatCurrency(product.price, product.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
