"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
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
          <Input id="contactPhone" name="contactPhone" defaultValue={store.contact_phone ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor="whatsappNumber">WhatsApp number</Label>
        <Input id="whatsappNumber" name="whatsappNumber" defaultValue={store.whatsapp_number ?? ""} />
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

      {state.error && <p className="text-sm text-(--color-danger)">{state.error}</p>}
      {state.success && <p className="text-sm text-(--color-success)">Saved.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
