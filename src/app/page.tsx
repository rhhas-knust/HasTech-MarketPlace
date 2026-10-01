import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { LiveDemoDashboard } from "@/components/landing/live-demo-dashboard";
import { getFoundingSpotsLeft } from "@/lib/founding";
import {
  COMMISSION_RATE_PERCENT,
  FOUNDING_MEMBER_LIMIT,
  PLATFORM_NAME,
  SUBSCRIPTION_PRICE_GHS,
} from "@/lib/constants";

// The founding-spots counter is read live from the database; refreshing it
// every few minutes keeps the page static-fast without going stale.
export const revalidate = 300;

const DM_MESSAGES = [
  { from: "them", text: "Is this still available?" },
  { from: "them", text: "How much?" },
  { from: "you", text: "GHS 45. Send to my MoMo 024…" },
  { from: "them", text: "I've sent it oo, check" },
  { from: "you", text: "Haven't seen it yet 😩" },
];

const STORE_EVENTS = [
  "Order #HC-1042 paid · GHS 45.00",
  "Receipt emailed to the customer",
  "Stock updated automatically",
];

const REASONS = [
  {
    title: "Get paid before you deliver",
    body: "Customers pay by MoMo or card at checkout. No more “I'll pay when it reaches” or chasing screenshots.",
  },
  {
    title: "Sell while you sleep",
    body: "Your store takes orders at 2am, on Sundays and while you're serving another customer.",
  },
  {
    title: "Look like a real brand",
    body: "A store link with your name, colours and prices earns the trust a chat never will.",
  },
  {
    title: "Know your numbers",
    body: "See what sells, who's buying and what's running low, instead of guessing from your chats.",
  },
];

const BUILD_STEPS = [
  { title: "Design it", body: "Name your store, pick your colour, add your first product. No account needed." },
  { title: "Claim it", body: "Create your account and everything you designed is saved into your real store." },
  { title: "Share it", body: "Drop your store link on WhatsApp, TikTok and Instagram and start taking payments." },
];

export default async function Home() {
  const spotsLeft = await getFoundingSpotsLeft();
  const hasFoundingSpots = spotsLeft !== null && spotsLeft > 0;

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
            <LinkButton href="/start" size="sm" className="whitespace-nowrap">
              Start selling
            </LinkButton>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero: motivation first */}
        <section className="bg-hero-glow">
          <div className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:pt-20">
            {hasFoundingSpots ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-(--color-brand) bg-(--color-brand-subtle) px-3 py-1 text-xs font-medium text-(--color-brand)">
                🎁 {spotsLeft} of {FOUNDING_MEMBER_LIMIT} founding spots left · no fees this month
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 text-xs font-medium text-(--color-ink-muted)">
                Built for Ghanaian businesses
              </span>
            )}
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-(--color-ink) sm:text-5xl">
              Stop selling in DMs.
              <br />
              <span className="text-(--color-brand)">Start selling like a real store.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-(--color-ink-muted)">
              Your customers already want to buy. Give them a store link where they can see your
              prices, pay with MoMo or card, and get a receipt, while you get your time back.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/start" size="lg" className="w-full sm:w-auto">
                Design your store free &rarr;
              </LinkButton>
              <LinkButton href="/store/amara-books" size="lg" variant="outline" className="w-full sm:w-auto">
                See a live store
              </LinkButton>
            </div>
            <p className="mt-3 text-xs text-(--color-ink-muted)">
              No account needed to start. Takes about 2 minutes.
            </p>
          </div>

          {/* Contrast: show the painful "before" first so the "after" lands */}
          <div className="mx-auto grid max-w-4xl gap-4 px-4 pb-16 sm:grid-cols-2">
            <div className="rounded-2xl border border-(--color-border) bg-(--color-surface-subtle) p-5 opacity-90">
              <p className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-muted)">
                Selling in DMs today
              </p>
              <div className="mt-4 space-y-2">
                {DM_MESSAGES.map((m, i) => (
                  <div key={i} className={m.from === "you" ? "flex justify-end" : "flex justify-start"}>
                    <span
                      className={
                        m.from === "you"
                          ? "max-w-[80%] rounded-2xl rounded-br-sm bg-(--color-border) px-3 py-1.5 text-sm text-(--color-ink)"
                          : "max-w-[80%] rounded-2xl rounded-bl-sm border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-ink)"
                      }
                    >
                      {m.text}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-(--color-border) pt-3 text-sm text-(--color-ink-muted)">
                Hours of replying, unconfirmed payments, lost orders.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-(--color-brand) bg-(--color-surface) p-5 shadow-xl shadow-(--color-brand)/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-(--color-brand)">
                With your {PLATFORM_NAME} store
              </p>
              <div className="mt-4 rounded-xl border border-(--color-border) p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-(--color-brand-subtle) text-xl">
                    🎓
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-(--color-ink)">Graduation sash</p>
                    <p className="font-mono text-sm text-(--color-ink-muted) tabular-nums">GHS 45.00</p>
                  </div>
                  <span className="rounded-md bg-(--color-brand) px-2.5 py-1 text-xs font-medium text-white">
                    Add to Cart
                  </span>
                </div>
              </div>
              <ul className="mt-3 space-y-2">
                {STORE_EVENTS.map((event) => (
                  <li key={event} className="flex items-center gap-2 text-sm text-(--color-ink)">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-success-subtle) text-[11px] text-(--color-success)">
                      ✓
                    </span>
                    {event}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-(--color-border) pt-3 text-sm text-(--color-ink)">
                Paid, confirmed and recorded, with no back-and-forth.
              </p>
            </div>
          </div>
        </section>

        {/* Motivation: why they'd actually use it */}
        <section className="border-y border-(--color-border) bg-(--color-surface) px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-(--color-ink) sm:text-3xl">
              Why sellers make the switch
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {REASONS.map((reason, i) => (
                <div key={reason.title}>
                  <p className="font-mono text-sm text-(--color-brand)">0{i + 1}</p>
                  <h3 className="mt-2 text-base font-semibold text-(--color-ink)">{reason.title}</h3>
                  <p className="mt-1.5 text-sm text-(--color-ink-muted)">{reason.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Digital numbers, not bars */}
        <section className="px-4 py-16">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-(--color-ink) sm:text-3xl">
                Watch your business move, live
              </h2>
              <p className="mt-3 text-(--color-ink-muted)">
                Every visit, order and cedi shows up the moment it happens. Open your dashboard and
                see exactly how today is going, at a glance.
              </p>
              <LinkButton href="/start" className="mt-6">
                Build mine now
              </LinkButton>
            </div>
            <LiveDemoDashboard />
          </div>
        </section>

        {/* Pricing contrast: anchor on the expensive option first */}
        <section className="border-y border-(--color-border) bg-(--color-surface-subtle) px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-(--color-ink) sm:text-3xl">
              What it costs to go online
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 opacity-80">
                <p className="text-sm font-medium text-(--color-ink-muted)">Hiring a developer</p>
                <p className="mt-3 font-mono text-3xl font-semibold text-(--color-ink-muted) line-through decoration-(--color-danger)/60">
                  GHS 3,000+
                </p>
                <p className="mt-1 text-sm text-(--color-ink-muted)">upfront, typical quote</p>
                <ul className="mt-4 space-y-1.5 text-sm text-(--color-ink-muted)">
                  <li>+ hosting every year</li>
                  <li>+ paying for every change</li>
                  <li>Weeks before you can sell</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
                <p className="text-sm font-medium text-(--color-ink)">Monthly plan</p>
                <p className="mt-3 font-mono text-3xl font-semibold text-(--color-ink)">
                  GHS {SUBSCRIPTION_PRICE_GHS}
                </p>
                <p className="mt-1 text-sm text-(--color-ink-muted)">per month, flat</p>
                <ul className="mt-4 space-y-1.5 text-sm text-(--color-ink)">
                  <li>✓ Everything included</li>
                  <li>✓ No cut of your sales</li>
                  <li>✓ Live today</li>
                </ul>
              </div>
              <div className="relative rounded-2xl border-2 border-(--color-brand) bg-(--color-surface) p-6 shadow-xl shadow-(--color-brand)/10">
                <span className="absolute -top-3 left-6 rounded-full bg-(--color-brand) px-2.5 py-0.5 text-xs font-medium text-white">
                  Most sellers pick this
                </span>
                <p className="text-sm font-medium text-(--color-brand)">Pay as you sell</p>
                <p className="mt-3 font-mono text-3xl font-semibold text-(--color-ink)">GHS 0</p>
                <p className="mt-1 text-sm text-(--color-ink-muted)">
                  upfront, then {COMMISSION_RATE_PERCENT}% only when you make a sale
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-(--color-ink)">
                  <li>✓ Everything included</li>
                  <li>✓ No sale, no fee</li>
                  <li>✓ Live today</li>
                </ul>
              </div>
            </div>
            {hasFoundingSpots && (
              <p className="mt-6 text-center text-sm text-(--color-ink)">
                🎁 <strong>Founding members pay nothing this month.</strong> {spotsLeft} of{" "}
                {FOUNDING_MEMBER_LIMIT} spots left.
              </p>
            )}
          </div>
        </section>

        {/* IKEA effect: build first, sign up after */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-(--color-ink) sm:text-3xl">
              Build it before you sign up
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-(--color-ink-muted)">
              See your store come to life first. Only create an account once you love it.
            </p>
            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {BUILD_STEPS.map((step, i) => (
                <li key={step.title} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-brand) font-mono text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-(--color-ink)">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-(--color-ink-muted)">{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-8 text-center">
              <LinkButton href="/start" size="lg">
                Design your store free &rarr;
              </LinkButton>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 rounded-xl border border-(--color-border) bg-(--color-surface-subtle) p-6 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-sm font-medium text-(--color-ink)">See it live: Amara Books</p>
              <p className="mt-1 text-sm text-(--color-ink-muted)">
                A real storefront running on {PLATFORM_NAME}: books and graduation sashes, on the
                exact same platform you&apos;d get.
              </p>
            </div>
            <LinkButton href="/store/amara-books" variant="outline" size="md" className="shrink-0">
              Visit the store
            </LinkButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-(--color-border) px-4 py-6 text-center text-sm text-(--color-ink-muted)">
        <p>{PLATFORM_NAME} &mdash; storefronts, orders and payments for small businesses.</p>
        <div className="mt-1 flex items-center justify-center gap-4">
          <Link href="/sell" className="hover:text-(--color-ink)">
            For sellers
          </Link>
          <Link href="/contact" className="hover:text-(--color-ink)">
            Talk to us
          </Link>
        </div>
      </footer>
    </div>
  );
}
