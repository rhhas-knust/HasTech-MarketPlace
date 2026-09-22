import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { PLATFORM_NAME } from "@/lib/constants";

const FEATURES = [
  {
    title: "Your own storefront",
    description:
      "A branded store page at your own address, with categories, products and a cart your customers already know how to use.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9.75 4.5 4.5h15L21 9.75M3 9.75v9A1.5 1.5 0 0 0 4.5 20.25h15A1.5 1.5 0 0 0 21 18.75v-9M3 9.75h18M9 20.25v-6a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v6"
      />
    ),
  },
  {
    title: "Get paid with Paystack",
    description:
      "Connect your own Paystack account and accept mobile money and card payments — money goes straight to you, order totals are always verified server-side.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 8.25v10.5A1.5 1.5 0 0 0 3.75 20.25h16.5a1.5 1.5 0 0 0 1.5-1.5V8.25M2.25 8.25V6.75a1.5 1.5 0 0 1 1.5-1.5h16.5a1.5 1.5 0 0 1 1.5 1.5v1.5M6 15h4"
      />
    ),
  },
  {
    title: "See what's working",
    description:
      "Track visits, sales and low stock from one dashboard — privacy-conscious analytics with no third-party trackers on your storefront.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3v16.5A1.5 1.5 0 0 0 4.5 21H21M7.5 15.75V12M12 15.75V8.25M16.5 15.75v-4.5M21 15.75V6"
      />
    ),
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-(--color-border) px-4 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="shrink-0 text-lg font-semibold text-(--color-ink)">
            <PlatformLogo />
          </span>
          <nav className="flex shrink-0 items-center gap-2 text-sm sm:gap-4">
            <Link href="/sell" className="hidden text-(--color-ink-muted) hover:text-(--color-ink) sm:inline">
              For sellers
            </Link>
            <Link href="/login" className="whitespace-nowrap text-(--color-ink-muted) hover:text-(--color-ink)">
              Sign in
            </Link>
            <LinkButton href="/signup" size="sm" className="whitespace-nowrap">
              Start selling
            </LinkButton>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="bg-hero-glow">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center">
            <span className="inline-flex items-center rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 text-xs font-medium text-(--color-ink-muted)">
              Built for Ghanaian businesses
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-(--color-ink) sm:text-5xl">
              Sell online without building a website from scratch
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-(--color-ink-muted)">
              Create your store, add products, accept payments with Paystack, and see your sales
              and visitors in one dashboard. Built for Ghanaian businesses, from bookshops to
              barbers.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/signup" size="lg" className="w-full sm:w-auto">
                Create your store
              </LinkButton>
              <LinkButton href="/login" size="lg" variant="outline" className="w-full sm:w-auto">
                Sign in
              </LinkButton>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 pb-20">
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-brand-subtle) text-(--color-brand)">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="h-5 w-5"
                    aria-hidden
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-(--color-ink)">{feature.title}</h2>
                <p className="mt-1.5 text-sm text-(--color-ink-muted)">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-xl border border-(--color-border) bg-(--color-surface-subtle) p-6 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-sm font-medium text-(--color-ink)">
                See it live: Amara Books
              </p>
              <p className="mt-1 text-sm text-(--color-ink-muted)">
                A real storefront running on {PLATFORM_NAME} — books and graduation sashes, built
                on the exact same platform any business here can use.
              </p>
            </div>
            <LinkButton href="/store/amara-books" variant="outline" size="md" className="shrink-0">
              Visit the store
            </LinkButton>
          </div>
        </div>
      </main>

      <footer className="border-t border-(--color-border) px-4 py-6 text-center text-sm text-(--color-ink-muted)">
        <p>{PLATFORM_NAME} &mdash; storefronts, orders and payments for small businesses.</p>
        <Link href="/sell" className="mt-1 inline-block hover:text-(--color-ink)">
          For sellers
        </Link>
      </footer>
    </div>
  );
}
