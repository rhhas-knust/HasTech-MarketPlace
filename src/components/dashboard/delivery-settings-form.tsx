"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldHint } from "@/components/ui/input";
import type { StoreSettings } from "@/lib/types/database";
import type { SettingsFormState } from "@/app/dashboard/[slug]/settings/actions";

export function DeliverySettingsForm({
  action,
  settings,
}: {
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  settings: StoreSettings;
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-2">
        <input id="deliveryEnabled" name="deliveryEnabled" type="checkbox" defaultChecked={settings.delivery_enabled} />
        <Label htmlFor="deliveryEnabled" className="mb-0">
          Offer delivery
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <input id="pickupEnabled" name="pickupEnabled" type="checkbox" defaultChecked={settings.pickup_enabled} />
        <Label htmlFor="pickupEnabled" className="mb-0">
          Offer pickup
        </Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="deliveryFee">Delivery fee</Label>
          <Input id="deliveryFee" name="deliveryFee" type="number" step="0.01" min="0" defaultValue={settings.delivery_fee} />
        </div>
        <div>
          <Label htmlFor="freeDeliveryThreshold">Free delivery above (optional)</Label>
          <Input
            id="freeDeliveryThreshold"
            name="freeDeliveryThreshold"
            type="number"
            step="0.01"
            min="0"
            defaultValue={settings.free_delivery_threshold ?? ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="deliveryNotes">Delivery notes (optional)</Label>
        <Textarea id="deliveryNotes" name="deliveryNotes" defaultValue={settings.delivery_notes ?? ""} />
      </div>

      <div>
        <Label htmlFor="lowStockThreshold">Low stock alert threshold</Label>
        <Input id="lowStockThreshold" name="lowStockThreshold" type="number" min="0" defaultValue={settings.low_stock_threshold} />
        <FieldHint>Products below this stock level show a &ldquo;low stock&rdquo; warning.</FieldHint>
      </div>

      {state.error && <p className="text-sm text-(--color-danger)">{state.error}</p>}
      {state.success && <p className="text-sm text-(--color-success)">Saved.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
