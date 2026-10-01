import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black,transparent)]" />
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-(--color-brand)/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-(--color-brand-2)/20 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Link href="/" className="text-center text-lg font-semibold text-(--color-ink)">
            <PlatformLogo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="rounded-[2rem] border border-(--color-border)/70 bg-(--color-surface) p-7 shadow-lift sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
