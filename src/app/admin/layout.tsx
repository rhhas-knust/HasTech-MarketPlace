import { redirect } from "next/navigation";
import Link from "next/link";
import { isPlatformAdmin } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/consultations", label: "Consultations" },
  { href: "/admin/feedback", label: "Feedback" },
];

/**
 * Single gate for every /admin/* page -- deliberately its own layout, with
 * no shared header/nav from the public site or seller dashboard, so this
 * never gets stumbled into and doesn't look like part of either. Individual
 * pages don't need their own isPlatformAdmin() check for rendering, but
 * server actions they call still do (a layout only guards navigation, not
 * the action endpoint itself -- see src/lib/consultations.ts).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPlatformAdmin())) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-(--color-surface-subtle)">
      <header className="border-b border-(--color-border) bg-(--color-surface) px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold text-(--color-ink)">HASTECH Admin</span>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-(--color-ink-muted) hover:text-(--color-ink)">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm text-(--color-ink-muted) hover:text-(--color-ink)">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
