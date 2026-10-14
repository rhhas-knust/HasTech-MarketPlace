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
  ExternalLink,
  MessageSquare,
  Megaphone,
  UserRound,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  count?: number;
  countTone?: "warning" | "danger";
}

/** The dashboard's sections, grouped by what the seller is trying to do. */
export function navGroups(base: string, ordersToFulfil = 0, stockAlerts = 0): { label?: string; links: NavLink[] }[] {
  return [
    { links: [{ href: base, label: "Overview", icon: LayoutDashboard, exact: true }] },
    {
      label: "Sell",
      links: [
        { href: `${base}/orders`, label: "Orders", icon: ShoppingBag, count: ordersToFulfil, countTone: "danger" },
        { href: `${base}/products`, label: "Products", icon: Package, count: stockAlerts, countTone: "warning" },
        { href: `${base}/categories`, label: "Categories", icon: Tag },
        { href: `${base}/customers`, label: "Customers", icon: Users },
      ],
    },
    {
      label: "Grow",
      links: [
        { href: `${base}/analytics`, label: "Analytics", icon: BarChart3 },
        { href: `${base}/promote`, label: "Promote", icon: Megaphone },
      ],
    },
    {
      label: "Store",
      links: [{ href: `${base}/settings`, label: "Settings", icon: Settings }],
    },
    {
      label: "Account",
      links: [
        { href: `${base}/account`, label: "Account", icon: UserRound },
        { href: `${base}/feedback`, label: "Feedback", icon: MessageSquare },
      ],
    },
  ];
}

export function isActive(pathname: string, link: { href: string; exact?: boolean }) {
  return link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function DashboardSidebar({
  storeSlug,
  storeName,
  isPublished,
  ordersToFulfil = 0,
  stockAlerts = 0,
  userEmail,
}: {
  storeSlug: string;
  storeName: string;
  isPublished: boolean;
  ordersToFulfil?: number;
  stockAlerts?: number;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const base = `/dashboard/${storeSlug}`;

  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-5">
      <div className="rounded-lg border border-(--color-border) bg-(--color-surface-subtle) p-3">
        <p className="truncate text-sm font-semibold text-(--color-ink)">{storeName}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-(--color-ink-muted)">
          <span
            aria-hidden
            className={cn("h-1.5 w-1.5 rounded-full", isPublished ? "bg-(--color-success)" : "bg-(--color-warning)")}
          />
          {isPublished ? "Live" : "Not published"}
        </p>
        <a
          href={`/store/${storeSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-(--color-brand) hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          View storefront
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>

      {navGroups(base, ordersToFulfil, stockAlerts).map((group, i) => (
        <div key={group.label ?? i}>
          {group.label && (
            <p className="mb-1 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-(--color-ink-muted)">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.links.map((link) => {
              const active = isActive(pathname, link);
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                      active
                        ? "bg-(--color-brand-subtle) text-(--color-brand)"
                        : "text-(--color-ink-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-ink)",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="flex-1">{link.label}</span>
                    {link.count ? (
                      <span
                        className={cn(
                          "min-w-6 rounded-md px-1.5 py-0.5 text-center text-xs font-semibold text-white",
                          link.countTone === "warning" ? "bg-(--color-warning)" : "bg-(--color-danger)",
                        )}
                      >
                        {link.count}
                        <span className="sr-only">{link.countTone === "warning" ? " need stock" : " to fulfil"}</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {userEmail !== undefined && (
        <form action="/auth/signout" method="post" className="border-t border-(--color-border) pt-4">
          <p className="mb-1 truncate px-3 text-xs text-(--color-ink-muted)">{userEmail}</p>
          <button
            type="submit"
            className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-(--color-ink-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-ink)"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </form>
      )}
    </nav>
  );
}
