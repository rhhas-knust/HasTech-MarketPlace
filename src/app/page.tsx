import Link from "next/link";
import { ArrowRight, Boxes, CreditCard, LayoutTemplate, Store } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroDemo } from "@/components/landing/hero-demo";
import { BusinessMarquee } from "@/components/landing/business-marquee";
import { HowItWorksVideo } from "@/components/landing/how-it-works-video";
import { Reveal } from "@/components/motion/reveal";
import { getFoundingSpotsLeft } from "@/lib/founding";
import {
  COMMISSION_RATE_PERCENT,
  FOUNDING_FREE_MONTHS,
  FOUNDING_MEMBER_LIMIT,
  SUBSCRIPTION_PRICE_GHS,
} from "@/lib/constants";

// The founding-places count is read from the database; refreshing it every
// few minutes keeps the page fast without going stale.
export const revalidate = 300;

const FEATURES = [
  {
    title: "A store page with your name on it",
    body: "Your products, prices and contact details at one link you can share on WhatsApp, Instagram or TikTok.",
    Icon: Store,
  },
  {
    title: "MoMo and card payments",
    body: "Customers pay through your own Paystack account, so the money goes to you, not to us. Every total is checked on our server.",
    Icon: CreditCard,
  },
  {
    title: "Orders, customers and stock",
    body: "See who ordered what, mark orders ready or delivered, and get warned before something runs out.",
    Icon: Boxes,
  },
  {
    title: "More than physical products",
    body: "Sell services and bookings, food orders, pre-orders and digital downloads like e-books or design files.",
    Icon: LayoutTemplate,
  },
];

export default async function Home() {
  const spotsLeft = await getFoundingSpotsLeft();
  const hasFoundingSpots = spotsLeft !== null && spotsLeft > 0;
  const breakEven = Math.round(SUBSCRIPTION_PRICE_GHS / (COMMISSION_RATE_PERCENT / 100)).toLocaleString("en-GH");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-8 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pb-12">
            <div>
              {hasFoundingSpots && (
                <Link
                  href="/start"
                  className="enter group mb-6 inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface) py-1.5 pr-3 pl-1.5 text-sm text-(--color-ink) transition-colors hover:border-(--color-border-strong)"
                >
                  <span className="rounded-md bg-(--color-brand-subtle) px-2 py-0.5 text-xs font-medium text-(--color-brand)">
                    {spotsLeft} of {FOUNDING_MEMBER_LIMIT} left
                  </span>
                  No platform fees for {FOUNDING_FREE_MONTHS} months
                  <ArrowRight className="h-3.5 w-3.5 text-(--color-ink-muted) transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              )}
              <h1
                className="enter max-w-xl text-4xl font-semibold tracking-tight text-(--color-ink) sm:text-[3.4rem] sm:leading-[1.05]"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                Sell online and get paid by{" "}
                <span className="relative whitespace-nowrap text-(--color-brand)">
                  MoMo or card
                  <svg
                    aria-hidden
                    viewBox="0 0 300 12"
                    preserveAspectRatio="none"
                    className="absolute -bottom-1.5 left-0 h-2.5 w-full text-(--color-brand) opacity-40"
                  >
                    <path
                      d="M2 9C60 3 140 2 298 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      pathLength={48}
                      className="draw-check"
                      style={{ animationDelay: "650ms", animationDuration: "700ms" }}
                    />
                  </svg>
                </span>
                .
              </h1>
              <p
                className="enter mt-6 max-w-lg text-lg text-(--color-ink-muted)"
                style={{ "--i": 2 } as React.CSSProperties}
              >
                Make a store page for your business, list what you sell, and take payments through your own Paystack
                account. Set it up from your phone in a few minutes.
              </p>
              <div
                className="enter mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
                style={{ "--i": 3 } as React.CSSProperties}
              >
                <LinkButton href="/start" size="lg" className="group">
                  Start selling
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </LinkButton>
                <Link href="#how-it-works" className="link-grow text-sm font-medium text-(--color-ink)">
                  Watch how it works
                </Link>
                <Link href="/store/amara-books" className="link-grow text-sm font-medium text-(--color-ink-muted)">
                  See a live store
                </Link>
              </div>
            </div>

            <div className="enter-scale relative" style={{ "--i": 3 } as React.CSSProperties}>
              <div aria-hidden className="absolute inset-x-6 inset-y-8 -z-10 rounded-3xl bg-(--color-brand-subtle)" />
              <HeroDemo />
            </div>
          </div>
        </section>

        <BusinessMarquee />

        {/* Features */}
        <section aria-labelledby="features-heading" className="border-t border-(--color-border)">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <Reveal>
              <h2 id="features-heading" className="max-w-lg text-3xl font-semibold tracking-tight text-(--color-ink)">
                Everything a small business needs to sell online.
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {FEATURES.map(({ title, body, Icon }, i) => (
                <Reveal key={title} index={i} className="h-full">
                  <div className="lift h-full rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-brand-subtle) text-(--color-brand)">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-5 font-semibold text-(--color-ink)">{title}</h3>
                    <p className="mt-1.5 text-(--color-ink-muted)">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          aria-labelledby="steps-heading"
          className="scroll-mt-20 border-t border-(--color-border) bg-(--color-surface)"
        >
          <div className="mx-auto max-w-6xl px-4 py-20">
            <Reveal>
              <h2 id="steps-heading" className="text-3xl font-semibold tracking-tight text-(--color-ink)">
                Live in three steps
              </h2>
              <p className="mt-3 max-w-prose text-(--color-ink-muted)">
                A 44-second walkthrough. Pick a step to jump to it.
              </p>
            </Reveal>
            <Reveal className="mt-10">
              <HowItWorksVideo />
            </Reveal>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-20 border-t border-(--color-border)">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <Reveal>
              <h2 id="pricing-heading" className="text-3xl font-semibold tracking-tight text-(--color-ink)">
                Simple pricing
              </h2>
              <p className="mt-3 max-w-prose text-(--color-ink-muted)">
                Pick one plan when you set up your store and switch any time. Paystack charges its own processing fee on
                each payment.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <Reveal index={0} className="h-full">
                <div className="lift h-full rounded-2xl border border-(--color-border) bg-(--color-surface) p-7">
                  <h3 className="font-semibold text-(--color-ink)">Pay as you sell</h3>
                  <p className="mt-4 text-4xl font-semibold tabular-nums tracking-tight text-(--color-ink)">
                    {COMMISSION_RATE_PERCENT}%
                    <span className="ml-1.5 text-base font-normal tracking-normal text-(--color-ink-muted)">of each sale</span>
                  </p>
                  <p className="mt-4 text-(--color-ink-muted)">No monthly fee. If you sell nothing, you pay nothing.</p>
                </div>
              </Reveal>
              <Reveal index={1} className="h-full">
                <div className="lift h-full rounded-2xl border border-(--color-border) bg-(--color-surface) p-7">
                  <h3 className="font-semibold text-(--color-ink)">Monthly</h3>
                  <p className="mt-4 text-4xl font-semibold tabular-nums tracking-tight text-(--color-ink)">
                    GHS {SUBSCRIPTION_PRICE_GHS}
                    <span className="ml-1.5 text-base font-normal tracking-normal text-(--color-ink-muted)">per month</span>
                  </p>
                  <p className="mt-4 text-(--color-ink-muted)">
                    No commission. Cheaper once you sell more than GHS {breakEven} a month.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20">
          <Reveal className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 rounded-3xl bg-(--color-brand) px-8 py-12 text-(--color-on-brand) sm:flex-row sm:items-center sm:justify-between sm:px-12">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your store could be live tonight.</h2>
                <p className="mt-2 opacity-90">Design it first. Create an account only when you like what you see.</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/start"
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-(--color-on-brand) px-5 font-medium text-(--color-brand) transition-transform duration-150 ease-out active:scale-[0.97]"
                >
                  Start selling <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link href="/contact" className="link-grow text-sm font-medium">
                  Ask us a question
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
