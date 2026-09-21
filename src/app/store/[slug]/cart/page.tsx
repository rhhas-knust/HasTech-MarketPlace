import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ShoppingCart, Trash2 } from "lucide-react";
import { getStoreBySlug } from "@/lib/store-data";
import { getCart } from "@/lib/cart";
import { formatCurrency } from "@/lib/money";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { primaryImage } from "@/lib/store-data";
import { updateQuantityAction, removeItemAction } from "./actions";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const { items, subtotal } = await getCart(store.id, store.slug);
  const boundUpdate = updateQuantityAction.bind(null, store.slug);
  const boundRemove = removeItemAction.bind(null, store.slug);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="Your cart is empty"
          description="Add a few products to see them here."
          action={<LinkButton href={`/store/${store.slug}`} variant="store">Browse products</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-(--color-ink)">Your cart</h1>

      <ul className="divide-y divide-(--color-border) rounded-xl border border-(--color-border) bg-(--color-surface)">
        {items.map((item) => {
          const image = item.product ? primaryImage(item.product as never) : null;
          return (
            <li key={item.id} className="flex items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-(--color-surface-subtle)">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-(--color-ink)">{item.product?.name ?? "Product"}</p>
                <p className="text-sm text-(--color-ink-muted)">{formatCurrency(item.unit_price, store.currency)}</p>
                <form action={boundUpdate} className="mt-2 flex items-center gap-2">
                  <input type="hidden" name="cartItemId" value={item.id} />
                  <label className="sr-only" htmlFor={`qty-${item.id}`}>
                    Quantity
                  </label>
                  <input
                    id={`qty-${item.id}`}
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={item.quantity}
                    className="h-8 w-16 rounded-md border border-(--color-border) px-2 text-sm"
                  />
                  <button type="submit" className="text-sm font-medium text-(--store-accent)">
                    Update
                  </button>
                </form>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="font-medium text-(--color-ink)">
                  {formatCurrency(item.unit_price * item.quantity, store.currency)}
                </p>
                <form action={boundRemove}>
                  <input type="hidden" name="cartItemId" value={item.id} />
                  <button
                    type="submit"
                    className="flex items-center gap-1 text-sm text-(--color-ink-muted) hover:text-(--color-danger)"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <span className="text-(--color-ink-muted)">Subtotal</span>
        <span className="text-lg font-semibold text-(--color-ink)">{formatCurrency(subtotal, store.currency)}</span>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link href={`/store/${store.slug}`} className="text-sm text-(--color-ink-muted) hover:text-(--color-ink)">
          ← Continue shopping
        </Link>
        <LinkButton href={`/store/${store.slug}/checkout`} variant="store" size="lg">
          Checkout
        </LinkButton>
      </div>
    </div>
  );
}
