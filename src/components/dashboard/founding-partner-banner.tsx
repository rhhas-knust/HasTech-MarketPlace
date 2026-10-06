"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquareText, X } from "lucide-react";

const STORAGE_KEY = "hastech_founding_banner_dismissed";

/**
 * Shown to founding members on every sign-in. Dismissing it only lasts for
 * the current login: the stored value is the sign-in timestamp, so a fresh
 * login brings it back.
 */
export function FoundingPartnerBanner({
  storeSlug,
  foundingUntil,
  signInKey,
}: {
  storeSlug: string;
  foundingUntil: string;
  signInKey: string;
}) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    let dismissedFor: string | null = null;
    try {
      dismissedFor = localStorage.getItem(STORAGE_KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setHidden(dismissedFor === signInKey);
  }, [signInKey]);

  if (hidden) return null;

  const until = new Date(foundingUntil).toLocaleDateString("en-GH", { day: "numeric", month: "long" });

  return (
    <section
      aria-label="Founding partner"
      className="relative flex flex-col gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-5 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1 pr-8 sm:pr-0">
        <p className="font-medium text-(--color-ink)">
          You&apos;re a founding partner. No platform fees until {until}.
        </p>
        <p className="mt-1 max-w-prose text-sm text-(--color-ink-muted)">
          You are one of our first sellers, and what you tell us decides what we fix and build next.
          If something is confusing, broken or missing, let us know.
        </p>
      </div>
      <Link
        href={`/dashboard/${storeSlug}/feedback`}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-(--color-border-strong)/60 px-4 text-sm font-medium text-(--color-ink) hover:bg-(--color-surface-subtle)"
      >
        <MessageSquareText className="h-4 w-4" aria-hidden /> Send feedback
      </Link>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, signInKey);
          } catch {}
          setHidden(true);
        }}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md text-(--color-ink-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-ink) sm:static"
        aria-label="Hide until next sign-in"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </section>
  );
}
