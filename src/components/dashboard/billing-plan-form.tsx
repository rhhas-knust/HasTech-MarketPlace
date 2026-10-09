"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { COMMISSION_RATE_PERCENT, SUBSCRIPTION_PRICE_GHS } from "@/lib/constants";
import type { BillingFormState } from "@/app/dashboard/[slug]/settings/billing/actions";

type Plan = "commission" | "subscription";

const PLANS: { value: Plan; title: string; price: string; unit: string; description: string }[] = [
  {
    value: "commission",
    title: "Pay as you sell",
    price: `${COMMISSION_RATE_PERCENT}%`,
    unit: "of each sale",
    description: "Nothing to pay in a month with no sales.",
  },
  {
    value: "subscription",
    title: "Monthly",
    price: `GHS ${SUBSCRIPTION_PRICE_GHS}`,
    unit: "per month",
    description: "A flat fee with no commission, however much you sell.",
  },
];

export function BillingPlanForm({
  action,
  currentPlan,
  disabled,
}: {
  action: (state: BillingFormState, formData: FormData) => Promise<BillingFormState>;
  currentPlan: Plan;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<BillingFormState, FormData>(action, {});
  const [selected, setSelected] = useState<Plan>(currentPlan);
  const changed = selected !== currentPlan;
  const selectedTitle = PLANS.find((p) => p.value === selected)?.title;

  return (
    <form action={formAction} className="space-y-4">
      <fieldset disabled={disabled || pending}>
        <legend className="sr-only">Choose a plan</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLANS.map((plan) => {
            const isSelected = selected === plan.value;
            return (
              <label
                key={plan.value}
                className={cn(
                  "relative flex cursor-pointer flex-col rounded-xl border-2 p-4 transition-[border-color,background-color,transform] duration-200 ease-(--ease-out) active:scale-[0.98] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--color-brand)",
                  isSelected
                    ? "border-(--color-brand) bg-(--color-brand-subtle)"
                    : "border-(--color-border) bg-(--color-surface) hover:border-(--color-border-strong)",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="radio"
                  name="billingPlan"
                  value={plan.value}
                  checked={isSelected}
                  onChange={() => setSelected(plan.value)}
                  className="sr-only"
                />
                <span className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-(--color-ink)">{plan.title}</span>
                  {/* Visible radio: ring, then a filled check when chosen. */}
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
                      isSelected ? "border-(--color-brand) bg-(--color-brand)" : "border-(--color-border-strong)",
                    )}
                  >
                    {isSelected && <Check key={plan.value} className="icon-swap h-3 w-3 text-(--color-on-brand)" strokeWidth={3} />}
                  </span>
                </span>
                <span className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-(--color-ink)">
                  {plan.price}
                  <span className="ml-1 text-sm font-normal tracking-normal text-(--color-ink-muted)">{plan.unit}</span>
                </span>
                <span className="mt-2 text-sm text-(--color-ink-muted)">{plan.description}</span>
                {currentPlan === plan.value && (
                  <span className="mt-3 inline-flex w-fit items-center rounded bg-(--color-surface-subtle) px-2 py-0.5 text-xs font-medium text-(--color-ink)">
                    Your current plan
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="rounded-md bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
            {state.error}
          </p>
        )}
        {state.success && !changed && (
          <p className="enter flex items-center gap-2 text-sm text-(--color-success)" style={{ animationDuration: "300ms" }}>
            <Check className="h-4 w-4" aria-hidden /> Saved. You&apos;re on the {selectedTitle} plan.
          </p>
        )}
      </div>

      <Button type="submit" disabled={disabled || pending || !changed}>
        {pending ? "Saving…" : changed ? `Switch to ${selectedTitle}` : "This is your current plan"}
      </Button>
    </form>
  );
}
