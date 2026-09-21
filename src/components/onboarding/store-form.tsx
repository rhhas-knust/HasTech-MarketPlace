"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldHint } from "@/components/ui/input";
import { BUSINESS_TYPE_OPTIONS } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import { createStoreAction, type OnboardingFormState } from "@/app/onboarding/actions";

export function StoreForm() {
  const [state, formAction, pending] = useActionState<OnboardingFormState, FormData>(
    createStoreAction,
    {},
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="name">Business name</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          placeholder="e.g. Amara Books"
        />
      </div>

      <div>
        <Label htmlFor="slug">Store URL</Label>
        <div className="flex items-center gap-1 text-sm text-(--color-ink-muted)">
          <span className="whitespace-nowrap">hastechcommerce.com/store/</span>
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="amara-books"
          />
        </div>
        <FieldHint>Lowercase letters, numbers and hyphens only.</FieldHint>
      </div>

      <div>
        <Label htmlFor="businessType">Business type</Label>
        <Select id="businessType" name="businessType" required defaultValue="retail">
          {BUSINESS_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <FieldHint>You can change this later. It shapes wording like &quot;Add to Cart&quot; vs &quot;Book Service&quot;.</FieldHint>
      </div>

      <div>
        <Label htmlFor="description">Short description (optional)</Label>
        <Textarea id="description" name="description" placeholder="What do you sell?" />
      </div>

      <fieldset className="space-y-4 border-t border-(--color-border) pt-4">
        <legend className="mb-1 text-sm font-medium text-(--color-ink)">Contact details</legend>
        <div>
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input id="contactPhone" name="contactPhone" placeholder="024 000 0000" />
        </div>
        <div>
          <Label htmlFor="whatsappNumber">WhatsApp number (optional)</Label>
          <Input id="whatsappNumber" name="whatsappNumber" placeholder="024 000 0000" />
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-lg bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating your store…" : "Create my store"}
      </Button>
    </form>
  );
}
