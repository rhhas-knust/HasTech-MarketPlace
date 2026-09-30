import Link from "next/link";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { ConsultationForm } from "@/components/consultation-form";
import { PLATFORM_NAME } from "@/lib/constants";
import { submitConsultationRequest } from "@/lib/consultations";

export const metadata: Metadata = {
  title: "Talk to us",
  description: "Questions about how HASTECH Commerce works, pricing, or anything else? Send us a message.",
};

const FAQS = [
  {
    q: "How does HASTECH Commerce actually work?",
    a: "You sign up, tell us about your business, and get a storefront at your own address within minutes — no coding, no developer. You add products or services, connect a way to get paid, and publish. Customers can then browse, order and pay directly.",
  },
  {
    q: "What does it cost?",
    a: "Most sellers are currently on our commission plan — 5% of each sale, only when you actually sell something. A flat monthly subscription is also available if you'd prefer that instead. The first sellers to join get every fee waived for a limited time as founding members.",
  },
  {
    q: "Do I need my own website first?",
    a: "No — your storefront lives on HASTECH Commerce from day one. Nothing about setup requires you to already have a website, a developer, or technical knowledge.",
  },
];

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-(--color-border) px-4 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link href="/" className="shrink-0 text-lg font-semibold text-(--color-ink)">
            <PlatformLogo />
          </Link>
          <nav className="flex shrink-0 items-center gap-2 text-sm sm:gap-4">
            <Link href="/sell" className="whitespace-nowrap text-(--color-ink-muted) hover:text-(--color-ink)">
              For sellers
            </Link>
            <LinkButton href="/signup" size="sm" className="whitespace-nowrap">
              Create your store
            </LinkButton>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="bg-hero-glow px-4 py-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-(--color-ink) sm:text-4xl">
            Have questions? Let&apos;s talk.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-(--color-ink-muted)">
            Curious how {PLATFORM_NAME} works, what it costs, or whether it&apos;s right for your business? Send us
            a message and we&apos;ll get back to you.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-10 px-4 py-12 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <ConsultationForm action={submitConsultationRequest} />
          </div>

          <div className="sm:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-(--color-ink-muted)">
              Quick answers
            </h2>
            <div className="mt-3 space-y-4">
              {FAQS.map((faq) => (
                <div key={faq.q}>
                  <p className="text-sm font-medium text-(--color-ink)">{faq.q}</p>
                  <p className="mt-1 text-sm text-(--color-ink-muted)">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
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
