"use client";

import { useRef, useState, useTransition } from "react";
import { Star, Trash2, Upload } from "lucide-react";
import type { ProductImage } from "@/lib/types/database";

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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((image) => (
          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-(--color-border)">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.alt_text ?? ""} className="h-full w-full object-cover" />
            {image.is_primary && (
              <span className="absolute left-1 top-1 rounded-full bg-(--color-brand) p-1 text-white">
                <Star className="h-3 w-3" fill="currentColor" />
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!image.is_primary && (
                <button
                  type="button"
                  onClick={() => startTransition(() => onSetPrimary(image.id))}
                  className="rounded bg-white/90 p-1"
                  aria-label="Set as primary"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => startTransition(() => onDelete(image.id))}
                className="rounded bg-white/90 p-1"
                aria-label="Delete image"
              >
                <Trash2 className="h-3.5 w-3.5 text-(--color-danger)" />
              </button>
            </div>
          </div>
        ))}

        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-(--color-border) text-(--color-ink-muted) hover:text-(--color-ink)">
          <Upload className="h-5 w-5" />
          <span className="text-xs">{pending ? "Uploading…" : "Add image"}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={pending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const formData = new FormData();
              formData.set("file", file);
              setError(undefined);
              startTransition(async () => {
                const result = await onUpload(formData);
                if (result.error) setError(result.error);
                if (inputRef.current) inputRef.current.value = "";
              });
            }}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-(--color-danger)">{error}</p>}
    </div>
  );
}
