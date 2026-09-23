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
      className="group flex flex-col overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-(--color-surface-subtle)">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt_text ?? product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-(--color-ink-muted)">
            No image
          </div>
        )}
        {product.is_preorder ? (
          <span className="absolute left-2 top-2">
            <Badge tone="brand">Pre-order</Badge>
          </span>
        ) : outOfStock ? (
          <span className="absolute left-2 top-2">
            <Badge tone="neutral">Out of stock</Badge>
          </span>
        ) : (
          product.featured && (
            <span className="absolute left-2 top-2">
              <Badge tone="brand">Featured</Badge>
            </span>
          )
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-(--color-ink)">{product.name}</p>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-semibold text-(--color-ink)">
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
