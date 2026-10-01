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
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-(--color-border) bg-(--color-surface)/60 px-6 py-14 text-center">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-brand-subtle) text-(--color-brand)">
          {icon}
        </div>
      )}
      <div>
        <p className="font-medium text-(--color-ink)">{title}</p>
        {description && <p className="mt-1 text-sm text-(--color-ink-muted)">{description}</p>}
      </div>
      {action}
    </div>
  );
}
