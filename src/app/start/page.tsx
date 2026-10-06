import Link from "next/link";
import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { StoreBuilder } from "@/components/builder/store-builder";
import { getFoundingSpotsLeft } from "@/lib/founding";

export const metadata: Metadata = {
  title: "Design your store",
  description: "Pick a store name, colour and first product. No account needed yet.",
};

export const revalidate = 300;

export default async function StartPage() {
  const spotsLeft = await getFoundingSpotsLeft();

  return (
    <div className="min-h-dvh bg-(--color-surface-subtle)">
      <header className="px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link href="/" className="text-lg font-semibold text-(--color-ink)">
            <PlatformLogo />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-(--color-ink-muted) hover:text-(--color-ink)">
              Sign in
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 pb-16 pt-4">
        <StoreBuilder spotsLeft={spotsLeft} />
      </main>
    </div>
  );
}
