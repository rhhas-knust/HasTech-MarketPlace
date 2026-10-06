import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LEGAL_UPDATED } from "@/lib/constants";

/** Shared layout for /privacy, /terms, /refunds and /cookies. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-(--color-ink)">{title}</h1>
        <p className="mt-2 text-sm text-(--color-ink-muted)">Last updated {LEGAL_UPDATED}</p>
        <div className="legal-prose mt-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
