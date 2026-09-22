"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import type { FeedbackFormState } from "@/app/dashboard/[slug]/feedback/actions";

const CATEGORIES = [
  { value: "bug", label: "Something's broken" },
  { value: "feature_request", label: "Feature request" },
  { value: "question", label: "Question" },
  { value: "other", label: "Other" },
];

export function FeedbackForm({
  action,
}: {
  action: (state: FeedbackFormState, formData: FormData) => Promise<FeedbackFormState>;
}) {
  const [state, formAction, pending] = useActionState<FeedbackFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4" key={state.success ? "submitted" : "form"}>
      <div>
        <Label htmlFor="category">What&apos;s this about?</Label>
        <Select id="category" name="category" defaultValue="bug">
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="message">Tell us what&apos;s going on</Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={5}
          maxLength={4000}
          placeholder="This is what I want, or this is what I've noticed..."
        />
      </div>
      {state.error && <p className="text-sm text-(--color-danger)">{state.error}</p>}
      {state.success && <p className="text-sm text-(--color-success)">Thanks — we&apos;ve got it.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}
