import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-(--color-border) px-6 py-12 text-center">
      {icon && <div className="text-(--color-ink-muted)">{icon}</div>}
      <div>
        <p className="font-medium text-(--color-ink)">{title}</p>
        {description && <p className="mt-1 text-sm text-(--color-ink-muted)">{description}</p>}
      </div>
      {action}
    </div>
  );
}
