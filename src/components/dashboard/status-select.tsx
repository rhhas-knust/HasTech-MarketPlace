"use client";

import { useState, useTransition } from "react";
import { CircleCheck } from "lucide-react";
import { Select } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface StatusConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
}

/**
 * A status dropdown that saves on change. Optionally asks before applying
 * consequential values (`confirm` maps a value to its question; values not
 * in the map apply straight away) and says "Saved" afterwards.
 */
export function StatusSelect({
  value,
  options,
  onChange,
  confirm,
  disabled,
  label,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => Promise<void>;
  confirm?: Partial<Record<string, StatusConfirmation>>;
  disabled?: boolean;
  label?: string;
}) {
  const [current, setCurrent] = useState(value);
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const apply = (next: string) =>
    startTransition(async () => {
      await onChange(next);
      setCurrent(next);
      setSaved(true);
    });

  const question = pendingValue ? confirm?.[pendingValue] : undefined;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        aria-label={label}
        value={pendingValue ?? current}
        disabled={pending || disabled}
        onChange={(e) => {
          const next = e.target.value;
          setSaved(false);
          if (confirm?.[next]) setPendingValue(next);
          else apply(next);
        }}
        className="w-auto min-w-40"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <span aria-live="polite" className="text-sm">
        {pending ? (
          <span className="text-(--color-ink-muted)">Saving…</span>
        ) : saved ? (
          <span className="inline-flex items-center gap-1 text-(--color-success)">
            <CircleCheck className="h-4 w-4" aria-hidden /> Saved
          </span>
        ) : null}
      </span>

      {question && (
        <ConfirmDialog
          key={pendingValue}
          defaultOpen
          trigger={() => null}
          title={question.title}
          description={question.description}
          confirmLabel={question.confirmLabel}
          tone="primary"
          onConfirm={() => {
            const next = pendingValue!;
            setPendingValue(null);
            apply(next);
          }}
          onCancel={() => setPendingValue(null)}
        />
      )}
    </div>
  );
}
