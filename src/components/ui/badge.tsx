import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "brand";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-(--color-surface-subtle) text-(--color-ink-muted)",
  success: "bg-(--color-success-subtle) text-(--color-success)",
  warning: "bg-(--color-warning-subtle) text-(--color-warning)",
  danger: "bg-(--color-danger-subtle) text-(--color-danger)",
  brand: "bg-(--color-brand-subtle) text-(--color-brand)",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
