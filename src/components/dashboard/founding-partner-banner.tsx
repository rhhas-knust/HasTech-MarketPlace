"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartHandshake, MessageSquareHeart, X } from "lucide-react";

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
    <section className="rounded-[1.6rem] bg-brand-gradient p-[2px] shadow-lift">
      <div className="relative flex flex-col gap-4 rounded-[calc(1.6rem-2px)] bg-(--color-surface) p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
          <HeartHandshake className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1 pr-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-(--color-brand)">Founding partner</p>
          <p className="mt-1 font-semibold text-(--color-ink)">
            Thank you for helping us build HASTECH. Your store is fee-free until {until}.
          </p>
          <p className="mt-1 text-sm text-(--color-ink-muted)">
            You&apos;re one of our first sellers, and your feedback is how we perfect the platform. Anything
            confusing, broken or missing? Tell us. We read every message.
          </p>
        </div>
        <Link
          href={`/dashboard/${storeSlug}/feedback`}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 text-sm font-medium text-white shadow-glow transition-transform hover:-translate-y-0.5"
        >
          <MessageSquareHeart className="h-4 w-4" /> Share feedback
        </Link>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, signInKey);
            } catch {}
            setHidden(true);
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-(--color-ink-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-ink)"
          aria-label="Dismiss until next sign-in"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
