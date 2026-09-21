import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { PLATFORM_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-(--color-border) px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-lg font-semibold text-(--color-ink)">{PLATFORM_NAME}</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-(--color-ink-muted) hover:text-(--color-ink)">
              Sign in
            </Link>
            <LinkButton href="/signup" size="sm">
              Start selling
            </LinkButton>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-center">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-(--color-ink) sm:text-5xl">
            Sell online without building a website from scratch
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-(--color-ink-muted)">
            Create your store, add products, accept payments with Paystack, and see your sales
            and visitors in one dashboard. Built for Ghanaian businesses, from bookshops to
            barbers.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <LinkButton href="/signup" size="lg">
              Create your store
            </LinkButton>
            <LinkButton href="/login" size="lg" variant="outline">
              Sign in
            </LinkButton>
          </div>
        </div>
      </main>

      <footer className="border-t border-(--color-border) px-4 py-6 text-center text-sm text-(--color-ink-muted)">
        {PLATFORM_NAME} &mdash; storefronts, orders and payments for small businesses.
      </footer>
    </div>
  );
}
