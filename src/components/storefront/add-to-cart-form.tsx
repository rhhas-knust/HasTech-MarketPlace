"use client";

import { useActionState, useEffect, useState } from "react";
import { Check } from "lucide-react";
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
  const [justAdded, setJustAdded] = useState(false);

  // Each successful submit returns a new state object; flash "Added" briefly.
  useEffect(() => {
    if (!state.success) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback for a completed server action
    setJustAdded(true);
    const timer = window.setTimeout(() => setJustAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="quantity" value={quantity} />
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-(--color-border)">
          <button
            type="button"
            className="h-10 w-10 text-lg text-(--color-ink) transition-transform duration-100 active:scale-90"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 overflow-hidden text-center text-sm font-medium tabular-nums">
            <span key={quantity} className="qty-tick inline-block">
              {quantity}
            </span>
          </span>
          <button
            type="button"
            className="h-10 w-10 text-lg text-(--color-ink) transition-transform duration-100 active:scale-90"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <Button type="submit" variant="store" size="lg" className="flex-1" disabled={disabled || pending}>
          <span key={justAdded ? "added" : "idle"} className="label-swap inline-flex items-center gap-2">
            {disabled ? (
              "Out of stock"
            ) : pending ? (
              "Adding…"
            ) : justAdded ? (
              <>
                <Check className="h-4 w-4" aria-hidden /> Added to cart
              </>
            ) : (
              ctaLabel
            )}
          </span>
        </Button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-(--color-danger)">
          {state.error}
        </p>
      )}
      <p role="status" className="sr-only">
        {justAdded ? "Added to cart." : ""}
      </p>
    </form>
  );
}
