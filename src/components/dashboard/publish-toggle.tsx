"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function PublishToggle({
  published,
  onPublish,
  onUnpublish,
  className,
}: {
  published: boolean;
  className?: string;
  onPublish: () => Promise<{ error?: string }>;
  onUnpublish: () => Promise<{ error?: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button
        variant={published ? "outline" : "primary"}
        size="sm"
        className={className}
        disabled={pending}
        onClick={() => startTransition(async () => {
          setError(null);
          const result = await (published ? onUnpublish() : onPublish());
          if (result?.error) setError(result.error);
        })}
      >
        {pending ? "Saving…" : published ? "Unpublish store" : "Publish store"}
      </Button>
      {/* basis-full: drops onto its own line inside the parent's flex-wrap row */}
      <p role="alert" className="basis-full text-sm text-(--color-danger) empty:hidden">
        {error}
      </p>
    </>
  );
}
