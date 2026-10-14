"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, Package, ShoppingBag, X } from "lucide-react";
import { DashboardSidebar, isActive } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { cn } from "@/lib/cn";

export function DashboardShell({
  storeSlug,
  storeName,
  isPublished,
  userEmail,
  ordersToFulfil,
  stockAlerts,
  children,
}: {
  storeSlug: string;
  storeName: string;
  isPublished: boolean;
  userEmail: string;
  ordersToFulfil: number;
  stockAlerts: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn === pathname;
  const base = `/dashboard/${storeSlug}`;

  const sidebar = (
    <DashboardSidebar
      storeSlug={storeSlug}
      storeName={storeName}
      isPublished={isPublished}
      ordersToFulfil={ordersToFulfil}
      stockAlerts={stockAlerts}
      userEmail={userEmail}
    />
  );

  const tabs = [
    { href: base, label: "Overview", icon: LayoutDashboard, exact: true, count: 0 },
    { href: `${base}/orders`, label: "Orders", icon: ShoppingBag, count: ordersToFulfil },
    { href: `${base}/products`, label: "Products", icon: Package, count: 0 },
  ];

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-(--color-border) bg-(--color-surface) px-4 lg:hidden">
        <span className="min-w-0 truncate text-sm font-semibold text-(--color-ink)">{storeName}</span>
        <ThemeToggle />
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-(--color-border) bg-(--color-surface) lg:block">
        <div className="flex h-full flex-col overflow-y-auto p-4">
          <div className="mb-5 flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-(--color-ink)">
              <PlatformLogo iconSize={16} />
            </span>
            <ThemeToggle />
          </div>
          {sidebar}
        </div>
      </aside>

      <main id="main" className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Mobile bottom navigation: the three places sellers go most, plus everything else */}
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-(--color-border) bg-(--color-surface) pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid grid-cols-4">
          {tabs.map((tab) => {
            const active = !menuOpen && isActive(pathname, tab);
            const Icon = tab.icon;
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
                    active ? "text-(--color-brand)" : "text-(--color-ink-muted)",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="absolute left-1/2 top-2 ml-2 min-w-5 rounded-full bg-(--color-danger) px-1.5 text-center text-[0.6875rem] font-semibold leading-5 text-white">
                      {tab.count}
                      <span className="sr-only"> to fulfil</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMenuOpenOn(menuOpen ? null : pathname)}
              aria-expanded={menuOpen}
              aria-controls="dashboard-menu"
              className={cn(
                "flex h-16 w-full flex-col items-center justify-center gap-1 text-xs font-medium",
                menuOpen ? "text-(--color-brand)" : "text-(--color-ink-muted)",
              )}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
              Menu
            </button>
          </li>
        </ul>
      </nav>

      {menuOpen && (
        <div id="dashboard-menu" className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] top-14 z-30 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpenOn(null)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85%] overflow-y-auto rounded-t-xl border-t border-(--color-border) bg-(--color-surface) p-4 shadow-raised">
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}
