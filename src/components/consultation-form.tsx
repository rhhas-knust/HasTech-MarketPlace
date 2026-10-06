"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/input";
import type { ConsultationFormState } from "@/lib/consultations";

export type ConsultationTopic = "how_it_works" | "pricing" | "privacy" | "other";

export function ConsultationForm({
  action,
  defaultTopic = "how_it_works",
}: {
  action: (state: ConsultationFormState, formData: FormData) => Promise<ConsultationFormState>;
  defaultTopic?: ConsultationTopic;
}) {
  const [state, formAction, pending] = useActionState<ConsultationFormState, FormData>(action, {});

  if (state.success) {
    return (
      <div role="status" className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <p className="font-medium text-(--color-ink)">Message sent.</p>
        <p className="mt-1 text-sm text-(--color-ink-muted)">We reply by email, usually within two working days.</p>
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

      <div>
        <Label htmlFor="topic">Topic</Label>
        <Select id="topic" name="topic" defaultValue={defaultTopic}>
          <option value="how_it_works">How the platform works</option>
          <option value="pricing">Pricing and fees</option>
          <option value="privacy">My personal data (access, correction, deletion)</option>
          <option value="other">Something else</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required aria-describedby="message-hint" />
        <FieldHint>
          <span id="message-hint">At least 10 characters.</span>
        </FieldHint>
      </div>

      <details className="rounded-md border border-(--color-border) px-3 py-2 text-sm">
        <summary className="cursor-pointer text-(--color-ink)">Add a phone number or business name (optional)</summary>
        <div className="mt-3 grid gap-4 pb-1 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" />
          </div>
          <div>
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" autoComplete="organization" />
          </div>
        </div>
      </details>

      <div className="flex items-start gap-3">
        <input
          id="acceptPrivacy"
          name="acceptPrivacy"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-(--color-brand)"
        />
        <label htmlFor="acceptPrivacy" className="text-sm text-(--color-ink-muted)">
          I agree that HASTECH Commerce may store these details to reply to me, as described in the{" "}
          <Link href="/privacy" className="font-medium text-(--color-ink) underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </label>
      </div>

      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="rounded-md bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
            {state.error}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
