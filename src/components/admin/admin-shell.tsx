"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, MessageSquareWarning, ShieldCheck, Store, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { cn } from "@/lib/cn";

interface AdminShellProps {
  userEmail: string;
  newConsultations: number;
  openFeedback: number;
  children: React.ReactNode;
}

function AdminNav({ newConsultations, openFeedback, onNavigate }: { newConsultations: number; openFeedback: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true, count: 0 },
    { href: "/admin/stores", label: "Stores", icon: Store, count: 0 },
    { href: "/admin/consultations", label: "Consultations", icon: Inbox, count: newConsultations },
    { href: "/admin/feedback", label: "Feedback", icon: MessageSquareWarning, count: openFeedback },
  ];

  return (
    <nav className="space-y-1">
      {links.map(({ href, label, icon: Icon, exact, count }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
              active
                ? "bg-(--color-brand) text-(--color-on-brand)"
                : "text-(--color-ink-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-ink)",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {count > 0 && (
              <span
                className={cn(
                  "min-w-6 rounded-md px-2 py-0.5 text-center text-xs font-semibold",
                  active ? "bg-white/25 text-white" : "bg-(--color-danger) text-white",
                )}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function OwnerBadge() {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-(--color-surface-subtle) p-2.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--color-brand) text-(--color-on-brand)">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-(--color-ink)">Owner console</p>
        <p className="text-xs text-(--color-ink-muted)">Only visible to you</p>
      </div>
    </div>
  );
}

export function AdminShell({ userEmail, newConsultations, openFeedback, children }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const footer = (
    <div className="space-y-1 border-t border-(--color-border) pt-4">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-(--color-ink-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-ink)"
      >
        <ExternalLink className="h-4 w-4" /> View public site
      </a>
      <form action="/auth/signout" method="post">
        <p className="truncate px-3.5 pb-1 pt-2 text-xs text-(--color-ink-muted)">{userEmail}</p>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-(--color-ink-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-ink)"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <div className="bg-(--color-surface) sticky top-0 z-40 flex items-center justify-between border-b border-(--color-border) px-4 py-3 lg:hidden">
        <span className="text-sm font-semibold text-(--color-ink)">
          <PlatformLogo iconSize={20} />
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-(--color-border) bg-(--color-surface)"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-3 mt-3 space-y-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-3 shadow-raised lg:hidden">
          <OwnerBadge />
          <AdminNav newConsultations={newConsultations} openFeedback={openFeedback} onNavigate={() => setOpen(false)} />
          {footer}
        </div>
      )}

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 p-4 lg:block">
        <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-semibold text-(--color-ink)">
              <PlatformLogo iconSize={18} />
            </span>
            <ThemeToggle />
          </div>
          <OwnerBadge />
          <AdminNav newConsultations={newConsultations} openFeedback={openFeedback} />
          <div className="mt-auto">{footer}</div>
        </div>
      </aside>

      <main id="main" className="min-w-0 flex-1 p-4 sm:p-6 lg:py-8 lg:pl-4 lg:pr-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
