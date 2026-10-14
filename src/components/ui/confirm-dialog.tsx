"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * A confirmation step for destructive or consequential actions, built on the
 * native <dialog> (focus trap, Escape to close and inert background for free).
 * `trigger` receives an `open` callback so any button can start it.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  pendingLabel = "Working…",
  tone = "danger",
  onConfirm,
  onCancel,
  defaultOpen = false,
}: {
  trigger: (open: () => void) => ReactNode;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => Promise<unknown> | unknown;
  onCancel?: () => void;
  /** Open on mount, for confirmations started by something other than a button. */
  defaultOpen?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();

  // Keep the native dialog (modal, focus trap, Escape) in step with state.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const close = () => setIsOpen(false);

  return (
    <>
      {trigger(() => setIsOpen(true))}
      <dialog
        ref={ref}
        // Escape closes the native dialog; mirror that in state.
        onClose={() => {
          if (isOpen) {
            setIsOpen(false);
            onCancel?.();
          }
        }}
        onClick={(e) => {
          // A click on the backdrop lands on the <dialog> element itself.
          if (e.target === e.currentTarget && !pending) {
            close();
            onCancel?.();
          }
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-(--color-border) bg-(--color-surface) p-0 text-(--color-ink) shadow-raised backdrop:bg-black/50 open:opacity-100 open:scale-100 starting:open:opacity-0 starting:open:scale-[0.97] transition-[opacity,scale] duration-150 ease-(--ease-out)"
      >
        <div className="p-5">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <div className="mt-2 text-sm text-(--color-ink-muted)">{description}</div>}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                close();
                onCancel?.();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={tone === "danger" ? "danger" : "primary"}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await onConfirm();
                  close();
                })
              }
            >
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
