"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function PublishToggle({
  published,
  onPublish,
  onUnpublish,
}: {
  published: boolean;
  onPublish: () => Promise<{ error?: string }>;
  onUnpublish: () => Promise<{ error?: string }>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={published ? "outline" : "primary"}
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => {
        await (published ? onUnpublish() : onPublish());
      })}
    >
      {pending ? "Saving…" : published ? "Unpublish store" : "Publish store"}
    </Button>
  );
}
