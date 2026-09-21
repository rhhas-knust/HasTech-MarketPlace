"use client";

import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { PLATFORM_NAME } from "@/lib/constants";

export function DashboardShell({
  storeSlug,
  storeName,
  userEmail,
  children,
}: {
  storeSlug: string;
  storeName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-surface) px-4 py-3 lg:hidden">
        <span className="text-sm font-semibold text-(--color-ink)">{PLATFORM_NAME}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--color-border)"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-b border-(--color-border) bg-(--color-surface) px-3 py-3 lg:hidden">
          <DashboardSidebar storeSlug={storeSlug} storeName={storeName} />
        </div>
      )}

      <aside className="hidden w-64 shrink-0 border-r border-(--color-border) bg-(--color-surface) p-4 lg:block">
        <p className="mb-4 px-2 text-xs font-medium uppercase tracking-wide text-(--color-ink-muted)">
          {PLATFORM_NAME}
        </p>
        <DashboardSidebar storeSlug={storeSlug} storeName={storeName} />
        <form action="/auth/signout" method="post" className="mt-8 border-t border-(--color-border) pt-4">
          <p className="mb-2 truncate px-2 text-xs text-(--color-ink-muted)">{userEmail}</p>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-(--color-ink-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-ink)"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
