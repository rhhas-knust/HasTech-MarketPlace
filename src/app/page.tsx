import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StorePreview } from "@/components/builder/store-preview";
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
  },
  {
    title: "MoMo and card payments",
    body: "Customers pay through your own Paystack account, so the money goes to you, not to us. Every total is checked on our server before an order is marked paid.",
  },
  {
    title: "Orders, customers and stock in one place",
    body: "See who ordered what, mark orders as ready or delivered, and get warned before something runs out.",
  },
  {
    title: "Works beyond physical products",
    body: "Sell services and bookings, food orders, pre-orders and digital downloads like e-books or design files.",
  },
];

const STEPS = [
  { title: "Design your store", body: "Pick a name, a colour and your first product. You can do this before creating an account." },
  { title: "Connect Paystack", body: "Link your Paystack account in Settings so customers can pay you directly." },
  { title: "Share your link", body: "Publish the store and send the link to your customers." },
];

const SAMPLE_STORE = {
  name: "Amara Books",
  businessType: "retail" as const,
  accentColor: "#0f766e",
  tagline: "Textbooks, past questions and graduation sashes in Accra.",
  productName: "Graduation sash",
  productPrice: "45",
};

export default async function Home() {
  const spotsLeft = await getFoundingSpotsLeft();
  const hasFoundingSpots = spotsLeft !== null && spotsLeft > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main" className="flex-1">
        <section className="border-b border-(--color-border)">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-(--color-ink) sm:text-5xl sm:leading-[1.08]">
                Sell online and get paid by MoMo or card.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-(--color-ink-muted)">
                Make a store page for your business, list what you sell, and take payments through your own
                Paystack account.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <LinkButton href="/start" size="lg">
                  Start selling
                </LinkButton>
                <Link
                  href="/store/amara-books"
                  className="text-sm font-medium text-(--color-ink) underline underline-offset-4 hover:text-(--color-brand)"
                >
                  View an example store
                </Link>
              </div>
              {hasFoundingSpots && (
                <p className="mt-6 text-sm text-(--color-ink-muted)">
                  The first {FOUNDING_MEMBER_LIMIT} stores pay no platform fees for {FOUNDING_FREE_MONTHS} months.{" "}
                  {spotsLeft} places left.
                </p>
              )}
            </div>
            <div aria-hidden className="lg:justify-self-end">
              <StorePreview draft={SAMPLE_STORE} />
            </div>
          </div>
        </section>

        <section aria-labelledby="features-heading" className="border-b border-(--color-border)">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_2fr]">
            <h2 id="features-heading" className="text-2xl font-semibold tracking-tight text-(--color-ink)">
              What you get
            </h2>
            <dl className="divide-y divide-(--color-border) border-y border-(--color-border)">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="grid gap-1 py-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                  <dt className="font-medium text-(--color-ink)">{feature.title}</dt>
                  <dd className="text-(--color-ink-muted)">{feature.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="steps-heading" className="border-b border-(--color-border)">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 id="steps-heading" className="text-2xl font-semibold tracking-tight text-(--color-ink)">
              How it works
            </h2>
            <ol className="mt-8 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="border-t-2 border-(--color-ink) pt-4">
                  <p className="text-sm tabular-nums text-(--color-ink-muted)">Step {i + 1}</p>
                  <h3 className="mt-1 font-medium text-(--color-ink)">{step.title}</h3>
                  <p className="mt-1 text-(--color-ink-muted)">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-20 border-b border-(--color-border)">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 id="pricing-heading" className="text-2xl font-semibold tracking-tight text-(--color-ink)">
              Pricing
            </h2>
            <p className="mt-2 max-w-prose text-(--color-ink-muted)">
              Choose one plan when you set up your store. You can switch later from your billing settings.
              Paystack charges its own processing fee on each payment.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
                <h3 className="font-medium text-(--color-ink)">Pay as you sell</h3>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-(--color-ink)">
                  {COMMISSION_RATE_PERCENT}%
                  <span className="ml-1 text-base font-normal text-(--color-ink-muted)">of each sale</span>
                </p>
                <p className="mt-3 text-sm text-(--color-ink-muted)">No monthly fee. If you sell nothing, you pay nothing.</p>
              </div>
              <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
                <h3 className="font-medium text-(--color-ink)">Monthly</h3>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-(--color-ink)">
                  GHS {SUBSCRIPTION_PRICE_GHS}
                  <span className="ml-1 text-base font-normal text-(--color-ink-muted)">per month</span>
                </p>
                <p className="mt-3 text-sm text-(--color-ink-muted)">
                  A flat fee with no commission on your sales. Cheaper once you sell more than GHS{" "}
                  {Math.round(SUBSCRIPTION_PRICE_GHS / (COMMISSION_RATE_PERCENT / 100)).toLocaleString("en-GH")} a month.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-(--color-ink)">Set up your store in a few minutes.</h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <LinkButton href="/start" size="lg">
                Start selling
              </LinkButton>
              <Link href="/contact" className="text-sm font-medium text-(--color-ink) underline underline-offset-4">
                Ask us a question
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
