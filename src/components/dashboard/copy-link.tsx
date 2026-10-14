"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** The store's public address with a one-tap copy, for sharing on WhatsApp or social media. */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const display = url.replace(/^https?:\/\//, "");

  return (
    <div className="flex min-w-0 max-w-full items-center gap-1 rounded-md border border-(--color-border) bg-(--color-surface-subtle) py-1 pl-3 pr-1 text-sm">
      <span className="min-w-0 truncate text-(--color-ink-muted)">{display}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Clipboard can be blocked (e.g. insecure context); the URL stays visible to copy by hand.
          }
        }}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded px-2 font-medium text-(--color-ink) transition-colors hover:bg-(--color-surface)"
        aria-label={copied ? "Link copied" : "Copy store link"}
      >
        {copied ? <Check className="h-4 w-4 text-(--color-success)" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}
