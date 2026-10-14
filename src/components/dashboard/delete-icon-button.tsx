"use client";

import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** A small delete icon that asks before deleting `itemName`. */
export function DeleteIconButton({
  itemName,
  description,
  onDelete,
}: {
  itemName: string;
  description?: string;
  onDelete: () => Promise<void>;
}) {
  return (
    <ConfirmDialog
      title={`Delete "${itemName}"?`}
      description={description}
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      onConfirm={onDelete}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-(--color-ink-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-danger)"
          aria-label={`Delete ${itemName}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      )}
    />
  );
}
