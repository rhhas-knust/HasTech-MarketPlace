"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readConsent, writeConsent } from "@/components/cookie-consent";
import type { ConsentChoice } from "@/lib/constants";

/** Lets a visitor change or withdraw their cookie choice. */
export function ConsentSettings() {
  const router = useRouter();
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cookies are only readable after mount
    setChoice(readConsent());
  }, []);

  return (
    <fieldset className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
      <legend className="px-1 text-sm font-medium text-(--color-ink)">Your cookie choice</legend>
      <div className="space-y-3">
        {(
          [
            { value: "essential", label: "Essential only", hint: "Sign-in and cart cookies. Always on." },
            { value: "all", label: "Essential and analytics", hint: "Also lets sellers count product views." },
          ] as const
        ).map((option) => (
          <label key={option.value} className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="consent"
              value={option.value}
              checked={choice === option.value}
              onChange={() => {
                setChoice(option.value);
                writeConsent(option.value);
                setSaved(true);
                router.refresh();
              }}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-medium text-(--color-ink)">{option.label}</span>
              <span className="block text-sm text-(--color-ink-muted)">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
      <p role="status" className="mt-3 text-sm text-(--color-success)">
        {saved ? "Saved." : ""}
      </p>
    </fieldset>
  );
}
