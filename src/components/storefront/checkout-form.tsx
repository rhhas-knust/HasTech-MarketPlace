"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldHint } from "@/components/ui/input";
import type { CheckoutFormState } from "@/app/store/[slug]/checkout/actions";

export function CheckoutForm({
  action,
  deliveryEnabled,
  pickupEnabled,
}: {
  action: (state: CheckoutFormState, formData: FormData) => Promise<CheckoutFormState>;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState<CheckoutFormState, FormData>(action, {});
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">(
    deliveryEnabled ? "delivery" : "pickup",
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" required autoComplete="given-name" />
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" required autoComplete="family-name" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="024 000 0000" />
        </div>
      </div>

      {deliveryEnabled && pickupEnabled && (
        <div>
          <Label>Delivery method</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="deliveryMethod"
                value="delivery"
                checked={deliveryMethod === "delivery"}
                onChange={() => setDeliveryMethod("delivery")}
              />
              Delivery
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="deliveryMethod"
                value="pickup"
                checked={deliveryMethod === "pickup"}
                onChange={() => setDeliveryMethod("pickup")}
              />
              Pickup
            </label>
          </div>
        </div>
      )}
      {!(deliveryEnabled && pickupEnabled) && (
        <input type="hidden" name="deliveryMethod" value={deliveryMethod} />
      )}

      {deliveryMethod === "delivery" && (
        <div className="space-y-4 border-t border-(--color-border) pt-4">
          <div>
            <Label htmlFor="addressLine">Delivery address</Label>
            <Input id="addressLine" name="addressLine" required autoComplete="street-address" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">City / Town</Label>
              <Input id="city" name="city" autoComplete="address-level2" />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input id="region" name="region" autoComplete="address-level1" />
            </div>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="notes">Order notes (optional)</Label>
        <Textarea id="notes" name="notes" placeholder="Anything the seller should know?" />
        <FieldHint>You&apos;ll be taken to Paystack to complete payment securely.</FieldHint>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
          {state.error}
        </p>
      )}

      <Button type="submit" variant="store" size="lg" className="w-full" disabled={pending}>
        {pending ? "Redirecting to payment…" : "Pay now"}
      </Button>
    </form>
  );
}
