import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ConsultationForm, type ConsultationTopic } from "@/components/consultation-form";
import { COMMISSION_RATE_PERCENT, SUBSCRIPTION_PRICE_GHS } from "@/lib/constants";
import { submitConsultationRequest } from "@/lib/consultations";

export const metadata: Metadata = {
  title: "Contact",
  description: "Ask about how HASTECH Commerce works, pricing, or your personal data.",
};

const TOPICS: ConsultationTopic[] = ["how_it_works", "pricing", "privacy", "other"];

const ANSWERS = [
  {
    q: "Do I need a website already?",
    a: "No. Your store page is hosted on HASTECH Commerce and you get a link to share.",
  },
  {
    q: "What does it cost?",
    a: `Either ${COMMISSION_RATE_PERCENT}% of each sale, or GHS ${SUBSCRIPTION_PRICE_GHS} a month with no commission. Paystack charges its own processing fee on each payment.`,
  },
  {
    q: "Who holds the money from sales?",
    a: "Payments go to the seller's own Paystack account. We never hold customer payments.",
  },
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const defaultTopic = TOPICS.find((t) => t === topic);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main id="main" className="mx-auto grid w-full max-w-5xl flex-1 gap-12 px-4 py-12 sm:py-16 lg:grid-cols-[3fr_2fr]">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-(--color-ink)">Contact us</h1>
          <p className="mt-2 max-w-prose text-(--color-ink-muted)">
            Send a question about the platform, or a request about your personal data. We reply by email.
          </p>
          <div className="mt-8">
            <ConsultationForm action={submitConsultationRequest} defaultTopic={defaultTopic} />
          </div>
        </div>

        <aside aria-labelledby="answers-heading">
          <h2 id="answers-heading" className="text-base font-semibold text-(--color-ink)">
            Common questions
          </h2>
          <dl className="mt-4 divide-y divide-(--color-border) border-y border-(--color-border)">
            {ANSWERS.map((item) => (
              <div key={item.q} className="py-4">
                <dt className="text-sm font-medium text-(--color-ink)">{item.q}</dt>
                <dd className="mt-1 text-sm text-(--color-ink-muted)">{item.a}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </main>

      <SiteFooter />
    </div>
  );
}
