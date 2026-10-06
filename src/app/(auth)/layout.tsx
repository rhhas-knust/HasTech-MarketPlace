import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { LegalLinks } from "@/components/legal-links";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col px-4">
      <header className="mx-auto flex w-full max-w-md items-center justify-between py-6">
        <Link href="/" className="text-base font-semibold text-(--color-ink)">
          <PlatformLogo />
        </Link>
        <ThemeToggle />
      </header>
      <main id="main" className="mx-auto w-full max-w-md flex-1">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 sm:p-8">{children}</div>
      </main>
      <footer className="mx-auto w-full max-w-md py-6">
        <LegalLinks />
      </footer>
    </div>
  );
}
