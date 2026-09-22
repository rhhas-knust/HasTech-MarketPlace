import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLATFORM_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-hero-glow flex min-h-screen items-center justify-center bg-(--color-surface-subtle) px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Link href="/" className="text-center text-lg font-semibold text-(--color-ink)">
            {PLATFORM_NAME}
          </Link>
          <ThemeToggle />
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 shadow-lg shadow-black/5">
          {children}
        </div>
      </div>
    </div>
  );
}
