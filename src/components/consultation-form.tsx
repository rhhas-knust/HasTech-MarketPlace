"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { ConsultationFormState } from "@/lib/consultations";

export function ConsultationForm({
  action,
}: {
  action: (state: ConsultationFormState, formData: FormData) => Promise<ConsultationFormState>;
}) {
  const [state, formAction, pending] = useActionState<ConsultationFormState, FormData>(action, {});

  if (state.success) {
    return (
      <div className="rounded-3xl border border-(--color-border)/70 bg-(--color-surface) shadow-soft p-6 text-center">
        <p className="text-base font-medium text-(--color-ink)">Thanks — we&apos;ve got your message.</p>
        <p className="mt-1 text-sm text-(--color-ink-muted)">We&apos;ll get back to you by email soon.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Honeypot: hidden from real visitors via CSS, not just "hidden" (bots
          often ignore that attribute); anything filled in here means a bot. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="website">Leave this field blank</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="024 000 0000" />
        </div>
        <div>
          <Label htmlFor="businessName">Business name (optional)</Label>
          <Input id="businessName" name="businessName" />
        </div>
      </div>

      <div>
        <Label htmlFor="topic">What would you like to know?</Label>
        <Select id="topic" name="topic" defaultValue="how_it_works">
          <option value="how_it_works">How the platform works</option>
          <option value="pricing">Pricing &amp; fees</option>
          <option value="other">Something else</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Your question</Label>
        <Textarea id="message" name="message" required placeholder="Tell us what you'd like to know..." />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
