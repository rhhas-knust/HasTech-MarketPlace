"use client";

import { useTransition } from "react";
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

  return (
    <Button
      variant={published ? "outline" : "primary"}
      size="sm"
      className={className}
      disabled={pending}
      onClick={() => startTransition(async () => {
        await (published ? onUnpublish() : onPublish());
      })}
    >
      {pending ? "Saving…" : published ? "Unpublish store" : "Publish store"}
    </Button>
  );
}
