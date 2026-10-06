import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-(--color-border) bg-(--color-surface)">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="shrink-0 text-base font-semibold text-(--color-ink)" aria-label="HASTECH Commerce home">
          <PlatformLogo textClassName="max-[400px]:sr-only" />
        </Link>
        <nav aria-label="Main" className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
          <Link href="/sell" className="hidden rounded-md px-3 py-2 text-(--color-ink-muted) hover:text-(--color-ink) sm:inline-block">
            For sellers
          </Link>
          <Link href="/#pricing" className="hidden rounded-md px-3 py-2 text-(--color-ink-muted) hover:text-(--color-ink) md:inline-block">
            Pricing
          </Link>
          <Link href="/login" className="whitespace-nowrap rounded-md px-2 py-2 text-(--color-ink-muted) hover:text-(--color-ink) sm:px-3">
            Sign in
          </Link>
          <LinkButton href="/start" size="sm">
            Start selling
          </LinkButton>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
