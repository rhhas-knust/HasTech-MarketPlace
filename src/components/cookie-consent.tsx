"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CONSENT_COOKIE, type ConsentChoice } from "@/lib/constants";

const MAX_AGE = 60 * 60 * 24 * 180;

export function readConsent(): ConsentChoice | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(all|essential)`));
  return (match?.[1] as ConsentChoice | undefined) ?? null;
}

export function writeConsent(choice: ConsentChoice) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${choice}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent("hastech:consent", { detail: choice }));
}

/** Asks once; the choice can be changed any time on the Cookies page. */
export function CookieConsent() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cookies are only readable after mount
    setShow(readConsent() === null);
    const onChange = () => setShow(false);
    window.addEventListener("hastech:consent", onChange);
    return () => window.removeEventListener("hastech:consent", onChange);
  }, []);

  if (!show) return null;

  const choose = (choice: ConsentChoice) => {
    writeConsent(choice);
    setShow(false);
    router.refresh();
  };

  return (
    <section
      role="region"
      aria-label="Cookie choices"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-xl border border-(--color-border) bg-(--color-surface) p-4 shadow-raised sm:p-5"
    >
      <p className="text-sm text-(--color-ink)">
        We use essential cookies to keep you signed in and remember your cart. With your permission we also set
        one analytics cookie that helps sellers count product views. We don&apos;t use advertising cookies.{" "}
        <Link href="/cookies" className="font-medium underline underline-offset-4">
          Cookie policy
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => choose("all")}
          className="inline-flex h-10 items-center rounded-md bg-(--color-ink) px-4 text-sm font-medium text-(--color-surface) hover:opacity-90"
        >
          Allow analytics
        </button>
        <button
          type="button"
          onClick={() => choose("essential")}
          className="inline-flex h-10 items-center rounded-md border border-(--color-border-strong)/60 px-4 text-sm font-medium text-(--color-ink) hover:bg-(--color-surface-subtle)"
        >
          Essential only
        </button>
      </div>
    </section>
  );
}
