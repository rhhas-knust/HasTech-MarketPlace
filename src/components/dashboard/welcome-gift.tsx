"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Copy, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearStoreDraft } from "@/lib/store-draft";

/** Shown once, right after a seller creates their store. */
export function WelcomeGift({
  storeName,
  storeUrl,
  foundingUntil,
  isPublished,
}: {
  storeName: string;
  storeUrl: string;
  foundingUntil: string | null;
  isPublished: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clearStoreDraft();
  }, []);

  const message = `${storeName} is now online. See what we have, order and pay with MoMo or card: ${storeUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const until = foundingUntil
    ? new Date(foundingUntil).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <section
      aria-labelledby="welcome-heading"
      className="relative rounded-xl border border-(--color-border) bg-(--color-surface) p-5 sm:p-6"
    >
      <button
        type="button"
        onClick={() => router.replace(pathname)}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md text-(--color-ink-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-ink)"
        aria-label="Dismiss welcome message"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      <h2 id="welcome-heading" className="pr-10 text-lg font-semibold text-(--color-ink)">
        {storeName} is set up
      </h2>
      {until && (
        <p className="mt-1 max-w-prose text-sm text-(--color-ink-muted)">
          As a founding member you pay no platform fees until {until}. Your feedback during this time
          decides what we build next, so tell us what to fix or add from the Feedback page.
        </p>
      )}

      <div className="mt-5 border-t border-(--color-border) pt-5">
        <h3 className="text-sm font-medium text-(--color-ink)">Announce your store</h3>
        <p className="mt-1 text-sm text-(--color-ink-muted)">
          {isPublished
            ? "Send this message to your customers:"
            : "Publish your store first, then send this message to your customers:"}
        </p>
        <p className="mt-3 rounded-md bg-(--color-surface-subtle) px-3 py-2 text-sm text-(--color-ink)">{message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-(--color-brand) px-4 text-sm font-medium text-(--color-on-brand) hover:bg-(--color-brand-hover)"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Share on WhatsApp
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              navigator.clipboard
                .writeText(message)
                .then(() => setCopied(true))
                .catch(() => {});
            }}
          >
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? "Copied" : "Copy message"}
          </Button>
          <span role="status" className="sr-only">
            {copied ? "Message copied to clipboard" : ""}
          </span>
        </div>
      </div>
    </section>
  );
}
