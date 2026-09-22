import Link from "next/link";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { PLATFORM_NAME, BUSINESS_TYPE_OPTIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sell on HASTECH Commerce",
  description:
    "Create a branded online store, accept Paystack payments and track sales — built for Ghanaian businesses of every kind.",
};

const STEPS = [
  {
    title: "Create your account",
    description:
      "Sign up with your email or Google account and tell us a bit about your business — retail, service, food, digital products, it all works.",
  },
  {
    title: "Add what you sell",
    description:
      "List your products or services with photos, prices and stock levels. Your storefront is live at your own address as soon as you publish it.",
  },
  {
    title: "Connect Paystack & get paid",
    description:
      "Link your own Paystack account from your dashboard. Customers pay by card or mobile money and it goes straight to you — HASTECH never holds your money.",
  },
];

const WHAT_YOU_GET = [
  "A branded storefront at your own store address, no coding required",
  "A product/service catalogue with photos, categories and stock tracking",
  "Checkout and order tracking your customers already know how to use",
  "A dashboard with orders, customers and privacy-conscious sales analytics",
  "Payments through your own Paystack account — you're never waiting on a platform payout",
];

const FAQS = [
  {
    q: "Do I need my own website or domain first?",
    a: "No. Signing up gives you a storefront at a HASTECH Commerce address (yourstore.hastech-marketplace.vercel.app/store/your-store). Custom domains aren't supported yet, but nothing about the setup requires you to have a website already.",
  },
  {
    q: "What kinds of businesses can sell here?",
    a: "Retail products, services and bookings, digital downloads, food orders, professional services, creator work, and organisations. The storefront adapts its labels automatically — a service business gets \"Book Service\" where a retailer gets \"Add to Cart\", for example.",
  },
  {
    q: "How do payments actually work?",
    a: "You connect your own Paystack account from Dashboard → Settings → Payments after you sign up. Every order total is verified on our server before it's marked paid, so neither you nor your customers have to trust a number typed into a form.",
  },
  {
    q: "Is there a monthly fee?",
    a: "Not right now — there are no subscription tiers or fees while we're onboarding early sellers. If that changes in future, existing sellers will be told in advance.",
  },
  {
    q: "How long does setup actually take?",
    a: "A few minutes to create your account and add your first product or service. There's no approval queue — your store goes live the moment you publish it.",
  },
];

export default function SellPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-(--color-border) px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-(--color-ink)">
            <PlatformLogo />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-(--color-ink-muted) hover:text-(--color-ink)">
              Sign in
            </Link>
            <LinkButton href="/signup" size="sm">
              Create your store
            </LinkButton>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="bg-hero-glow">
          <div className="mx-auto max-w-3xl px-4 py-20 text-center">
            <span className="inline-flex items-center rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 text-xs font-medium text-(--color-ink-muted)">
              For first-time sellers
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-(--color-ink) sm:text-5xl">
              Bring your business online, without hiring a developer
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-(--color-ink-muted)">
              Whatever you sell — books, clothes, a barber shop, catering, tutoring, digital
              downloads — you can have a real storefront and be taking payments today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/signup" size="lg">
                Create your free store
              </LinkButton>
              <LinkButton href="#how-it-works" size="lg" variant="outline">
                See how it works
              </LinkButton>
            </div>
          </div>
        </div>

        <div id="how-it-works" className="mx-auto max-w-5xl scroll-mt-16 px-4 py-16">
          <h2 className="text-center text-2xl font-semibold text-(--color-ink)">
            Three steps to your first sale
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-(--color-brand) text-sm font-semibold text-white">
                  {i + 1}
                </div>
                <h3 className="text-base font-semibold text-(--color-ink)">{step.title}</h3>
                <p className="mt-1.5 text-sm text-(--color-ink-muted)">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-y border-(--color-border) bg-(--color-surface) px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-(--color-ink)">
              Built for every kind of business
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-(--color-ink-muted)">
              The same platform adapts to whatever you&apos;re selling — no separate product for
              services versus goods.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {BUSINESS_TYPE_OPTIONS.filter((o) => o.value !== "other").map((option) => (
                <span
                  key={option.value}
                  className="rounded-full border border-(--color-border) bg-(--color-surface-subtle) px-3.5 py-1.5 text-sm text-(--color-ink) transition-colors duration-150 hover:border-(--color-brand) hover:text-(--color-brand)"
                >
                  {option.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-(--color-ink)">
                Everything included from day one
              </h2>
              <ul className="mt-6 space-y-3">
                {WHAT_YOU_GET.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-(--color-ink)">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="mt-0.5 h-4 w-4 shrink-0 text-(--color-success)"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-(--color-border) bg-(--color-surface-subtle) p-6">
              <p className="text-sm font-medium text-(--color-ink)">See it live: Amara Books</p>
              <p className="mt-1.5 text-sm text-(--color-ink-muted)">
                A real bookshop selling books and graduation sashes, running on the exact same
                storefront and dashboard you&apos;d get — nothing about their store is custom-built.
              </p>
              <LinkButton href="/store/amara-books" variant="outline" size="md" className="mt-4">
                Visit the store
              </LinkButton>
            </div>
          </div>
        </div>

        <div className="border-t border-(--color-border) px-4 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center text-2xl font-semibold text-(--color-ink)">
              Questions from new sellers
            </h2>
            <div className="mt-8 divide-y divide-(--color-border) rounded-xl border border-(--color-border) bg-(--color-surface)">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group px-5 py-4 open:pb-4">
                  <summary className="cursor-pointer list-none text-sm font-medium text-(--color-ink) marker:content-none">
                    {faq.q}
                  </summary>
                  <p className="mt-2 text-sm text-(--color-ink-muted)">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-hero-glow border-t border-(--color-border) px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-(--color-ink)">Ready to start selling?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-(--color-ink-muted)">
            It takes a few minutes to set up your store and start adding products or services.
          </p>
          <LinkButton href="/signup" size="lg" className="mt-6">
            Create your free store
          </LinkButton>
        </div>
      </main>

      <footer className="border-t border-(--color-border) px-4 py-6 text-center text-sm text-(--color-ink-muted)">
        <Link href="/" className="hover:text-(--color-ink)">
          &larr; Back to {PLATFORM_NAME}
        </Link>
      </footer>
    </div>
  );
}
