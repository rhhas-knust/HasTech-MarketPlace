"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import type { ProductImage } from "@/lib/types/database";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Same limits the server enforces (src/lib/product-images.ts); checked here
// first only so the seller gets an instant answer instead of a slow upload.
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const controlButton =
  "flex h-8 w-8 items-center justify-center rounded-md bg-(--color-surface)/95 text-(--color-ink) shadow-raised transition-transform duration-150 active:scale-[0.94]";

export function ImageManager({
  images,
  onUpload,
  onDelete,
  onSetPrimary,
}: {
  images: ProductImage[];
  onUpload: (formData: FormData) => Promise<{ error?: string }>;
  onDelete: (imageId: string) => Promise<void>;
  onSetPrimary: (imageId: string) => Promise<void>;
}) {
  const [uploading, startUpload] = useTransition();
  const [busy, startBusy] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      {images.length === 0 && !uploading && (
        <p className="mb-3 rounded-lg bg-(--color-warning-subtle) px-3 py-2 text-sm text-(--color-warning)">
          No photos yet. Products with photos get far more orders.
        </p>
      )}

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((image) => (
          <li key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface-subtle)">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.alt_text ?? ""} className="h-full w-full object-cover" loading="lazy" />
            {image.is_primary && (
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-(--color-brand) px-1.5 py-0.5 text-[0.6875rem] font-medium text-(--color-on-brand)">
                <Star className="h-3 w-3" fill="currentColor" aria-hidden /> Cover
              </span>
            )}
            {/* Always visible on touch screens; revealed on hover where there's a mouse. */}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 p-1.5 transition-opacity duration-150 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100">
              {!image.is_primary && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startBusy(() => onSetPrimary(image.id))}
                  className={controlButton}
                  aria-label="Use as cover photo"
                  title="Use as cover photo"
                >
                  <Star className="h-4 w-4" aria-hidden />
                </button>
              )}
              <ConfirmDialog
                title="Delete this photo?"
                description="It will be removed from the product straight away."
                confirmLabel="Delete photo"
                pendingLabel="Deleting…"
                onConfirm={() => onDelete(image.id)}
                trigger={(open) => (
                  <button type="button" onClick={open} className={controlButton} aria-label="Delete photo" title="Delete photo">
                    <Trash2 className="h-4 w-4 text-(--color-danger)" aria-hidden />
                  </button>
                )}
              />
            </div>
          </li>
        ))}

        <li>
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-(--color-border-strong) text-center text-(--color-ink-muted) transition-colors hover:border-(--color-brand) hover:text-(--color-brand) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--color-brand)">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ImagePlus className="h-5 w-5" aria-hidden />}
            <span className="text-xs font-medium">{uploading ? "Uploading…" : "Add photo"}</span>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reset = () => {
                  if (inputRef.current) inputRef.current.value = "";
                };
                if (!ACCEPTED.includes(file.type)) {
                  setError("That file isn't a supported image. Use JPEG, PNG, WEBP or GIF.");
                  reset();
                  return;
                }
                if (file.size > MAX_BYTES) {
                  setError(`That photo is ${(file.size / 1024 / 1024).toFixed(1)} MB. Photos must be 5 MB or smaller.`);
                  reset();
                  return;
                }
                const formData = new FormData();
                formData.set("file", file);
                setError(undefined);
                startUpload(async () => {
                  const result = await onUpload(formData);
                  if (result.error) setError(result.error);
                  reset();
                });
              }}
            />
          </label>
        </li>
      </ul>

      <div aria-live="polite">
        {error ? (
          <p role="alert" className="mt-3 text-sm text-(--color-danger)">
            {error}
          </p>
        ) : (
          <p className="mt-3 text-xs text-(--color-ink-muted)">JPEG, PNG, WEBP or GIF, up to 5 MB each.</p>
        )}
      </div>
    </div>
  );
}
