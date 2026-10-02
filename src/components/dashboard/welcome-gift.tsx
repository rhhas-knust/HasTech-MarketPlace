"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GiftBox } from "@/components/gift-box";
import { Button } from "@/components/ui/button";
import { clearStoreDraft } from "@/lib/store-draft";

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

  const message = `🎉 ${storeName} is now online! See what we have, order and pay with MoMo or card here: ${storeUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-(--color-success)">
            ✓ Setup complete · 100%
          </p>
          <h2 className="mt-1 text-lg font-semibold text-(--color-ink)">Welcome to your store, you made it!</h2>
        </div>
        <button
          type="button"
          onClick={() => router.replace(pathname)}
          className="text-sm text-(--color-ink-muted) hover:text-(--color-ink)"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <GiftBox label="Your welcome gift is here. Tap to open">
        <div className="space-y-4">
          {foundingUntil && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-(--color-brand)">
                Founding member
              </p>
              <p className="mt-1 text-lg font-semibold text-(--color-ink)">
                No platform fees until{" "}
                {new Date(foundingUntil).toLocaleDateString("en-GH", { day: "numeric", month: "long" })}
              </p>
              <p className="text-sm text-(--color-ink-muted)">
                Every cedi you make until then is yours. As a founding partner, your feedback
                directly shapes how HASTECH works, so tell us what to fix or add.
              </p>
            </div>
          )}
          <div className={foundingUntil ? "border-t border-(--color-border) pt-4" : undefined}>
            <p className="text-xs font-semibold uppercase tracking-wider text-(--color-brand)">Launch kit</p>
            <p className="mt-1 text-sm text-(--color-ink)">
              {isPublished
                ? "Your announcement is written. Send it to your customers now:"
                : "Your announcement is written. Publish your store (top right), then send it to your customers:"}
            </p>
            <p className="mt-2 rounded-lg bg-(--color-surface-subtle) px-3 py-2 text-sm text-(--color-ink)">{message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-lg bg-[#25D366] px-4 text-sm font-medium text-white hover:opacity-90"
              >
                Share on WhatsApp
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
                {copied ? "Copied ✓" : "Copy message"}
              </Button>
            </div>
          </div>
        </div>
      </GiftBox>
    </div>
  );
}
