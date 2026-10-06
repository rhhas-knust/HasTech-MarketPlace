import Link from "next/link";
import { formatCurrency } from "@/lib/money";
import { isOutOfStock } from "@/lib/inventory";
import { primaryImage, type ProductWithImages } from "@/lib/store-data";
import { Badge } from "@/components/ui/badge";

export function ProductCard({
  storeSlug,
  product,
  index,
}: {
  storeSlug: string;
  product: ProductWithImages;
  /** Position in a grid; when set, cards fade in one after another. */
  index?: number;
}) {
  const image = primaryImage(product);
  const onSale = product.sale_price != null && product.sale_price < product.price;
  const outOfStock = isOutOfStock(product);

  const card = (
    <Link
      href={`/store/${storeSlug}/product/${product.slug}`}
      className="lift group flex h-full flex-col overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) p-2"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-(--color-surface-subtle)">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.alt_text ?? product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-(--ease-out) group-hover:scale-[1.04]"
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
          <span className="rounded-md bg-(--color-surface-subtle) px-2.5 py-0.5 tabular-nums text-sm font-semibold text-(--color-ink)">
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

  if (index === undefined) return card;
  // The entrance lives on a wrapper so it never fights the card's hover lift.
  return (
    <div className="enter" style={{ "--i": Math.min(index, 8), animationDuration: "500ms" } as React.CSSProperties}>
      {card}
    </div>
  );
}
