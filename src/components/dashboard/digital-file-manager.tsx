"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Trash2, Upload } from "lucide-react";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DigitalFileManager({
  fileName,
  fileSize,
  onUpload,
  onRemove,
}: {
  fileName: string | null;
  fileSize: number | null;
  onUpload: (formData: FormData) => Promise<{ error?: string }>;
  onRemove: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
      {fileName ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm text-(--color-ink)">
            <FileText className="h-4 w-4 shrink-0 text-(--color-ink-muted)" />
            <span className="truncate">{fileName}</span>
            {fileSize != null && (
              <span className="shrink-0 text-(--color-ink-muted)">({formatFileSize(fileSize)})</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => startTransition(onRemove)}
            disabled={pending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-(--color-border) text-(--color-danger) disabled:opacity-50"
            aria-label="Remove file"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-(--color-border) py-6 text-center text-sm text-(--color-ink-muted) hover:text-(--color-ink)">
          <Upload className="h-5 w-5" />
          <span>{pending ? "Uploading…" : "Upload a file for customers to download after purchase"}</span>
          <span className="text-xs">PDF, EPUB, ZIP, PSD, AI and more — up to 20MB</span>
          <input
            ref={inputRef}
            type="file"
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
      )}
      {error && <p className="mt-2 text-sm text-(--color-danger)">{error}</p>}
    </div>
  );
}
