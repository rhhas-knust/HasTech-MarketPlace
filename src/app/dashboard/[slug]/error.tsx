"use client"; // Error boundaries must be Client Components

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown inside the dashboard (navigation stays usable) when a page fails to load. */
export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-xl border border-(--color-border) bg-(--color-surface) p-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-(--color-danger-subtle) text-(--color-danger)">
        <TriangleAlert className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-(--color-ink)">This page didn&apos;t load</h1>
      <p className="mt-1 text-sm text-(--color-ink-muted)">
        Something went wrong on our side or the connection dropped. Your store and orders are safe.
      </p>
      <Button className="mt-5" onClick={() => retry()}>
        Try again
      </Button>
      {error.digest && <p className="mt-4 text-xs text-(--color-ink-muted)">Reference: {error.digest}</p>}
    </div>
  );
}
