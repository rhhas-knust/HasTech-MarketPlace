"use client";

import { useActionState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import type { BillingFormState } from "@/app/dashboard/[slug]/settings/billing/actions";

const PLANS = [
  {
    value: "commission" as const,
    title: "Commission",
    description: "5% of each sale, only when you sell. Nothing owed if you make no sales.",
  },
  {
    value: "subscription" as const,
    title: "Subscription",
    description: "A flat GHS 100.00 per month, however much you sell.",
  },
];

export function BillingPlanForm({
  action,
  currentPlan,
  disabled,
}: {
  action: (state: BillingFormState, formData: FormData) => Promise<BillingFormState>;
  currentPlan: "commission" | "subscription";
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<BillingFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <fieldset disabled={disabled} className="grid gap-3 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <label
            key={plan.value}
            className={cn(
              "cursor-pointer rounded-xl border border-(--color-border) bg-(--color-surface-subtle) p-4 has-checked:border-(--color-brand) has-checked:bg-(--color-brand-subtle)",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="radio"
              name="billingPlan"
              value={plan.value}
              defaultChecked={currentPlan === plan.value}
              className="sr-only"
            />
            <p className="text-sm font-semibold text-(--color-ink)">{plan.title}</p>
            <p className="mt-1 text-sm text-(--color-ink-muted)">{plan.description}</p>
          </label>
        ))}
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-lg bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={disabled || pending} size="sm">
        {pending ? "Saving…" : "Save plan"}
      </Button>
    </form>
  );
}
