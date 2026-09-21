"use client";

import { useState } from "react";
import { Link2, MessageCircle, Share2, Check } from "lucide-react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) text-(--color-ink-muted) hover:text-(--color-ink)"
        aria-label="Share on WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) text-(--color-ink-muted) hover:text-(--color-ink)"
        aria-label="Share on Facebook"
      >
        <Share2 className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // clipboard API unavailable; nothing to fall back to safely
          }
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) text-(--color-ink-muted) hover:text-(--color-ink)"
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4 text-(--color-success)" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
