import { SearchX } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

/** For an order or product that doesn't exist (or isn't in this store). */
export default function DashboardNotFound() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-(--color-border) bg-(--color-surface) p-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-(--color-surface-subtle) text-(--color-ink-muted)">
        <SearchX className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-(--color-ink)">We couldn&apos;t find that</h1>
      <p className="mt-1 text-sm text-(--color-ink-muted)">
        It may have been deleted, or the link is wrong.
      </p>
      <LinkButton href="/dashboard" variant="outline" className="mt-5">
        Back to dashboard
      </LinkButton>
    </div>
  );
}
