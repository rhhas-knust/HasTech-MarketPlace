"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button type="button" variant="danger" size="sm" onClick={() => setConfirming(true)}>
        Delete product
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-(--color-ink-muted)">Delete permanently?</span>
      <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => startTransition(onDelete)}>
        {pending ? "Deleting…" : "Confirm"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
