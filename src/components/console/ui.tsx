import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-(--color-ink)">{title}</h1>
        {description && <p className="mt-1 text-sm text-(--color-ink-muted)">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--color-brand) text-sm font-semibold text-white",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function KpiTile({
  label,
  value,
  delta,
  icon,
  href,
}: {
  label: string;
  value: string;
  delta?: { value: number; period: string };
  icon: ReactNode;
  href?: string;
}) {
  const body = (
    <div
      className={cn(
        "h-full rounded-xl border border-(--color-border) bg-(--color-surface) p-5",
        href && "lift",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-(--color-ink-muted)">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-brand) text-(--color-on-brand)">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-(--color-ink)">
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium",
            delta.value > 0
              ? "bg-(--color-success-subtle) text-(--color-success)"
              : "bg-(--color-surface-subtle) text-(--color-ink-muted)",
          )}
        >
          {delta.value > 0 ? `▲ +${delta.value}` : "No change"} {delta.period}
        </p>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

/** A single ratio against a limit: brand fill on a lighter step of the same hue. */
export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div
        className="h-3 overflow-hidden rounded-full bg-(--color-brand-subtle)"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-(--color-brand) transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function timeAgo(iso: string, now: number) {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatShortDate(iso);
}

export function FilterTabs({ tabs }: { tabs: { href: string; label: string; count: number; active: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab.active
              ? "bg-(--color-brand) text-(--color-on-brand)"
              : "border border-(--color-border) bg-(--color-surface) text-(--color-ink-muted) hover:text-(--color-ink)",
          )}
        >
          {tab.label}
          <span className={cn("rounded-md px-2 py-0.5 text-xs", tab.active ? "bg-white/25" : "bg-(--color-surface-subtle)")}>
            {tab.count}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function CardHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-(--color-ink)">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-(--color-ink-muted)">{description}</p>}
    </div>
  );
}
