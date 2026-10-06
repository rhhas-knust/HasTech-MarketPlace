import { PlatformLogo } from "@/components/platform-logo";
import { LegalLinks } from "@/components/legal-links";

export function SiteFooter() {
  return (
    <footer className="border-t border-(--color-border)">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-(--color-ink-muted)">
          <PlatformLogo iconSize={18} />
          <p className="mt-2">Online stores and payments for businesses in Ghana.</p>
        </div>
        <LegalLinks />
      </div>
    </footer>
  );
}
