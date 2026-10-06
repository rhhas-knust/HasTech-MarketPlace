import Link from "next/link";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  BUSINESS_TYPE_OPTIONS,
  COMMISSION_RATE_PERCENT,
  FOUNDING_FREE_MONTHS,
  FOUNDING_MEMBER_LIMIT,
  SUBSCRIPTION_PRICE_GHS,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sell on HASTECH Commerce",
  description: "What you need to open an online store on HASTECH Commerce and start taking MoMo and card payments.",
};

const NEEDS = [
  {
    title: "An email address or Google account",
    body: "To create your seller account. We send a 6-digit code to confirm it.",
  },
  {
    title: "A few product or service details",
    body: "A name, a price and ideally a photo for each. You can start with one and add more later.",
  },
  {
    title: "A Paystack account",
    body: "Free to open at paystack.com with your Ghana Card and business details. You paste its API keys into your store settings. Until then, your store can be built but not take payments.",
  },
  {
    title: "Your business contact details",
    body: "A phone or email and an address. Ghanaian law requires online sellers to show these to buyers.",
  },
];

const FAQS = [
  {
    q: "Do I need my own website or domain?",
    a: "No. Your store gets an address like hastech-marketplace.vercel.app/store/your-store. Custom domains aren't available yet.",
  },
  {
    q: "How do payments work?",
    a: "Customers pay on Paystack's page by MoMo or card, and the money goes to your own Paystack account. We check every amount with Paystack before marking an order paid.",
  },
  {
    q: "What does it cost?",
    a: `${COMMISSION_RATE_PERCENT}% of each sale, or GHS ${SUBSCRIPTION_PRICE_GHS} a month with no commission. The first ${FOUNDING_MEMBER_LIMIT} stores pay no platform fees for ${FOUNDING_FREE_MONTHS} months.`,
  },
  {
    q: "Is there an approval process?",
    a: "No. Your store goes live when you press Publish. We may suspend stores that break the Terms.",
  },
];

export default function SellPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main" className="flex-1">
        <section className="border-b border-(--color-border)">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-(--color-ink) sm:text-5xl sm:leading-[1.08]">
              Open an online store without hiring a developer.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-(--color-ink-muted)">
              Books, clothes, catering, haircuts, tutoring or e-books: list what you sell, share one link, and get paid
              into your own Paystack account.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <LinkButton href="/start" size="lg">
                Start selling
              </LinkButton>
              <Link
                href="/store/amara-books"
                className="text-sm font-medium text-(--color-ink) underline underline-offset-4 hover:text-(--color-brand)"
              >
                See Amara Books&rsquo; store
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="needs-heading" className="border-b border-(--color-border)">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_2fr]">
            <h2 id="needs-heading" className="text-2xl font-semibold tracking-tight text-(--color-ink)">
              What you need
            </h2>
            <ol className="divide-y divide-(--color-border) border-y border-(--color-border)">
              {NEEDS.map((item, i) => (
                <li key={item.title} className="grid gap-1 py-5 sm:grid-cols-[2rem_1fr] sm:gap-4">
                  <span className="text-sm tabular-nums text-(--color-ink-muted)">{i + 1}.</span>
                  <div>
                    <h3 className="font-medium text-(--color-ink)">{item.title}</h3>
                    <p className="mt-1 text-(--color-ink-muted)">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="types-heading" className="border-b border-(--color-border)">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_2fr]">
            <h2 id="types-heading" className="text-2xl font-semibold tracking-tight text-(--color-ink)">
              Who it works for
            </h2>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {BUSINESS_TYPE_OPTIONS.filter((o) => o.value !== "other").map((option) => (
                <div key={option.value}>
                  <dt className="font-medium text-(--color-ink)">{option.label}</dt>
                  <dd className="mt-0.5 text-sm text-(--color-ink-muted)">
                    {option.description} Buyers see &ldquo;{option.ctaLabel}&rdquo;.
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="border-b border-(--color-border)">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_2fr]">
            <h2 id="faq-heading" className="text-2xl font-semibold tracking-tight text-(--color-ink)">
              Questions
            </h2>
            <dl className="divide-y divide-(--color-border) border-y border-(--color-border)">
              {FAQS.map((faq) => (
                <div key={faq.q} className="py-5">
                  <dt className="font-medium text-(--color-ink)">{faq.q}</dt>
                  <dd className="mt-1 text-(--color-ink-muted)">{faq.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto flex max-w-6xl flex-col px-4 gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-(--color-ink)">Design your store before you sign up.</h2>
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
