"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { SPONSOR_WEEKLY_PRICE_GHS, SPONSOR_WEEK_OPTIONS } from "@/lib/constants";
import type { PromoteFormState } from "@/app/dashboard/[slug]/promote/actions";

export function PromoteForm({
  action,
  disabled,
  extending,
}: {
  action: (state: PromoteFormState, formData: FormData) => Promise<PromoteFormState>;
  disabled?: boolean;
  /** True when a promotion is already running: the new weeks are added after it. */
  extending?: boolean;
}) {
  const [state, formAction, pending] = useActionState<PromoteFormState, FormData>(action, {});
  const [weeks, setWeeks] = useState<number>(SPONSOR_WEEK_OPTIONS[1]);
  const total = weeks * SPONSOR_WEEKLY_PRICE_GHS;

  return (
    <form action={formAction} className="space-y-4">
      <fieldset disabled={disabled || pending}>
        <legend className="mb-2 text-sm font-medium text-(--color-ink)">
          {extending ? "Add more weeks" : "How long?"}
        </legend>
        <div className="grid grid-cols-3 gap-3">
          {SPONSOR_WEEK_OPTIONS.map((option) => {
            const selected = weeks === option;
            return (
              <label
                key={option}
                className={cn(
                  "relative flex cursor-pointer flex-col rounded-xl border-2 p-3 transition-[border-color,background-color,transform] duration-200 ease-(--ease-out) active:scale-[0.98] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--color-brand)",
                  selected
                    ? "border-(--color-brand) bg-(--color-brand-subtle)"
                    : "border-(--color-border) bg-(--color-surface) hover:border-(--color-border-strong)",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="radio"
                  name="weeks"
                  value={option}
                  checked={selected}
                  onChange={() => setWeeks(option)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between">
                  <span className="font-semibold text-(--color-ink)">
                    {option} week{option === 1 ? "" : "s"}
                  </span>
                  {selected && <Check key={option} className="icon-swap h-4 w-4 text-(--color-brand)" aria-hidden />}
                </span>
                <span className="mt-1 text-sm tabular-nums text-(--color-ink-muted)">
                  GHS {option * SPONSOR_WEEKLY_PRICE_GHS}
                </span>
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
      </div>

      <Button type="submit" disabled={disabled || pending}>
        {pending ? "Opening Paystack…" : `Pay GHS ${total} with Paystack`}
      </Button>
    </form>
  );
}
