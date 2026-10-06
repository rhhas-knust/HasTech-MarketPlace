"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadStoreDraft } from "@/lib/store-draft";

/** Reminds a visitor who designed a store at /start that it's waiting for them. */
export function DraftClaimBanner() {
  const [storeName, setStoreName] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadStoreDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    if (draft?.name.trim()) setStoreName(draft.name.trim());
  }, []);

  if (!storeName) {
    return (
      <p className="mb-4 text-sm text-(--color-ink-muted)">
        Prefer to see your store first?{" "}
        <Link href="/start" className="font-medium text-(--color-brand) underline-offset-4 hover:underline">
          Design it before signing up
        </Link>
      </p>
    );
  }

  return (
    <p className="mb-4 rounded-md border border-(--color-border) bg-(--color-surface-subtle) px-3 py-2 text-sm text-(--color-ink)">
      Your design for <strong>{storeName}</strong> is saved in this browser. Create an account to keep it.
    </p>
  );
}
