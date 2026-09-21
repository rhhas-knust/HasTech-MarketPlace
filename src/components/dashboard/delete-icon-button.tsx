"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteIconButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(onDelete)}
      className="flex h-8 w-8 items-center justify-center rounded-md text-(--color-ink-muted) hover:text-(--color-danger)"
      aria-label="Delete"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
