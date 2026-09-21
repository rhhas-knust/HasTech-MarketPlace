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
    <div className={cn("rounded-xl border border-(--color-border) bg-(--color-surface) p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-(--color-ink-muted)">{label}</p>
        {icon && <span className="text-(--color-ink-muted)">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold text-(--color-ink)">{value}</p>
      {hint && <p className="mt-1 text-xs text-(--color-ink-muted)">{hint}</p>}
    </div>
  );
}
