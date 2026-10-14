"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Copy, Eye, EyeOff, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";

const iconButton =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-(--color-border) bg-(--color-surface) text-(--color-ink-muted) transition-[color,background-color,transform] duration-150 hover:bg-(--color-surface-subtle) hover:text-(--color-ink) active:scale-[0.96] disabled:opacity-50";

/**
 * Everything a seller can do to one product from the list: edit, preview on
 * the storefront, publish/unpublish, duplicate and delete (with a confirm).
 */
export function ProductRowActions({
  name,
  editHref,
  previewHref,
  status,
  onSetStatus,
  onDuplicate,
  onDelete,
  className,
}: {
  name: string;
  editHref: string;
  previewHref: string | null;
  status: "draft" | "published" | "archived";
  onSetStatus: (status: "published" | "draft") => Promise<void>;
  onDuplicate: () => Promise<void>;
  onDelete: () => Promise<void>;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Link href={editHref} className={iconButton} aria-label={`Edit ${name}`} title="Edit">
        <Pencil className="h-4 w-4" aria-hidden />
      </Link>
      {previewHref && (
        <a
          href={previewHref}
          target="_blank"
          rel="noopener noreferrer"
          className={iconButton}
          aria-label={`View ${name} on your storefront (opens in a new tab)`}
          title="View on storefront"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      )}
      {status !== "archived" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => onSetStatus(status === "published" ? "draft" : "published"))}
          className={iconButton}
          aria-label={status === "published" ? `Unpublish ${name}` : `Publish ${name}`}
          title={status === "published" ? "Unpublish (hide from customers)" : "Publish"}
        >
          {status === "published" ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(onDuplicate)}
        className={iconButton}
        aria-label={`Duplicate ${name}`}
        title="Duplicate"
      >
        <Copy className="h-4 w-4" aria-hidden />
      </button>
      <ConfirmDialog
        title={`Delete "${name}"?`}
        description="This removes the product from your store. Past orders keep their details. This can't be undone."
        confirmLabel="Delete product"
        pendingLabel="Deleting…"
        onConfirm={onDelete}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            className={cn(iconButton, "hover:text-(--color-danger)")}
            aria-label={`Delete ${name}`}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        )}
      />
    </div>
  );
}
