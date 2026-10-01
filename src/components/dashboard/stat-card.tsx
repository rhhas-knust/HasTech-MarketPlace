import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { RollingDigits } from "@/components/rolling-digits";

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
        "rounded-3xl border border-(--color-border)/70 bg-(--color-surface) p-5 shadow-soft transition-transform duration-200 hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-(--color-ink-muted)">{label}</p>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-(--color-ink)">
        <RollingDigits text={value} />
      </p>
      {hint && <p className="mt-1 text-xs text-(--color-ink-muted)">{hint}</p>}
    </div>
  );
}
