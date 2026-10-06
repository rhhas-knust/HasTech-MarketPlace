"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/input";
import { BUSINESS_TYPE_OPTIONS } from "@/lib/constants";
import type { Store } from "@/lib/types/database";
import type { SettingsFormState } from "@/app/dashboard/[slug]/settings/actions";

export function StoreInfoForm({
  action,
  store,
}: {
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  store: Store;
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Business name</Label>
        <Input id="name" name="name" required defaultValue={store.name} />
      </div>
      <div>
        <Label htmlFor="businessType">Business type</Label>
        <Select id="businessType" name="businessType" defaultValue={store.business_type}>
          {BUSINESS_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={store.description ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={store.contact_email ?? ""} />
        </div>
        <div>
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input id="contactPhone" name="contactPhone" type="tel" autoComplete="tel" defaultValue={store.contact_phone ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor="whatsappNumber">WhatsApp number</Label>
        <Input id="whatsappNumber" name="whatsappNumber" type="tel" defaultValue={store.whatsapp_number ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={store.address ?? ""} />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={store.city ?? ""} />
        </div>
        <div>
          <Label htmlFor="region">Region</Label>
          <Input id="region" name="region" defaultValue={store.region ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor="refundPolicy">Refund and returns policy</Label>
        <Textarea
          id="refundPolicy"
          name="refundPolicy"
          rows={5}
          maxLength={4000}
          aria-describedby="refundPolicy-hint"
          defaultValue={store.refund_policy ?? ""}
        />
        <FieldHint>
          <span id="refundPolicy-hint">
            Shown on your store. Ghanaian law requires online sellers to publish one. Leave empty to use the{" "}
            <a href="/refunds#seller-default" className="underline underline-offset-4">
              default policy
            </a>
            .
          </span>
        </FieldHint>
      </div>

      <div aria-live="polite">
        {state.error && <p role="alert" className="text-sm text-(--color-danger)">{state.error}</p>}
        {state.success && <p className="text-sm text-(--color-success)">Saved.</p>}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
