import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-(--color-border) bg-(--color-surface) p-5 transition-transform duration-200",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-(--color-ink-muted)">{label}</p>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-brand) text-(--color-on-brand)">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-(--color-ink)">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-(--color-ink-muted)">{hint}</p>}
    </div>
  );
}
