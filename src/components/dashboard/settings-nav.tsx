import Link from "next/link";
import { cn } from "@/lib/cn";

const TABS = [
  { key: "store", label: "Store", path: "" },
  { key: "payments", label: "Payments", path: "/payments" },
  { key: "billing", label: "Billing", path: "/billing" },
] as const;

/** Title and tabs shared by the three settings pages. */
export function SettingsNav({ storeSlug, active }: { storeSlug: string; active: (typeof TABS)[number]["key"] }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-(--color-ink)">Settings</h1>
      <nav aria-label="Settings sections" className="flex gap-1 border-b border-(--color-border)">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/${storeSlug}/settings${tab.path}`}
            aria-current={active === tab.key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active === tab.key
                ? "border-(--color-brand) text-(--color-brand)"
                : "border-transparent text-(--color-ink-muted) hover:text-(--color-ink)",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
