"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Store,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/cn";

export function DashboardSidebar({ storeSlug, storeName }: { storeSlug: string; storeName: string }) {
  const pathname = usePathname();
  const base = `/dashboard/${storeSlug}`;

  const links = [
    { href: base, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `${base}/products`, label: "Products", icon: Package },
    { href: `${base}/categories`, label: "Categories", icon: Tag },
    { href: `${base}/orders`, label: "Orders", icon: ShoppingBag },
    { href: `${base}/customers`, label: "Customers", icon: Users },
    { href: `${base}/analytics`, label: "Analytics", icon: BarChart3 },
    { href: `${base}/settings`, label: "Settings", icon: Settings },
    { href: `${base}/feedback`, label: "Feedback", icon: MessageSquare },
  ];

  return (
    <nav className="space-y-1">
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-(--color-surface-subtle) p-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
          <Store className="h-4 w-4" />
        </span>
        <span className="truncate text-sm font-semibold text-(--color-ink)">{storeName}</span>
      </div>

      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-brand-gradient text-white shadow-glow"
                : "text-(--color-ink-muted) hover:translate-x-0.5 hover:bg-(--color-surface-subtle) hover:text-(--color-ink)",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}

      <a
        href={`/store/${storeSlug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-(--color-border) px-3.5 py-2.5 text-sm font-medium text-(--color-ink-muted) transition-colors hover:border-(--color-brand)/40 hover:text-(--color-brand)"
      >
        <ExternalLink className="h-4 w-4" />
        View storefront
      </a>
    </nav>
  );
}
