"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AddToCartState } from "@/app/store/[slug]/product/[productSlug]/actions";

export function AddToCartForm({
  action,
  ctaLabel,
  maxQuantity,
  disabled,
}: {
  action: (state: AddToCartState, formData: FormData) => Promise<AddToCartState>;
  ctaLabel: string;
  maxQuantity: number;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<AddToCartState, FormData>(action, {});
  const [quantity, setQuantity] = useState(1);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="quantity" value={quantity} />
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-(--color-border)">
          <button
            type="button"
            className="h-10 w-10 text-lg text-(--color-ink)"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            className="h-10 w-10 text-lg text-(--color-ink)"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <Button type="submit" variant="store" size="lg" className="flex-1" disabled={disabled || pending}>
          {disabled ? "Out of stock" : pending ? "Adding…" : ctaLabel}
        </Button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-(--color-danger)">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-(--color-success)">
          Added to cart.
        </p>
      )}
    </form>
  );
}
