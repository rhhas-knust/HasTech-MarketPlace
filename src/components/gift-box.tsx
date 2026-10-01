"use client";

import { useState, type ReactNode } from "react";

const CONFETTI_COLORS = ["#4338ca", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

/**
 * A closed gift the visitor has to tap to open. Opening it is the reward
 * moment; the content is only revealed once they've chosen to open it.
 */
export function GiftBox({
  label = "Tap to open your gift",
  children,
  defaultOpen = false,
}: {
  label?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-(--color-brand)/50 bg-(--color-brand-subtle) px-4 py-7 text-center shadow-soft transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <span className="text-5xl motion-safe:animate-[gift-wiggle_2.4s_ease-in-out_infinite]" aria-hidden>
          🎁
        </span>
        <span className="text-sm font-semibold text-(--color-brand)">{label}</span>
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-(--color-brand)/40 bg-(--color-surface) p-6 shadow-lift motion-safe:animate-[gift-pop_500ms_ease-out]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-0 block h-2 w-1.5 rounded-sm motion-safe:animate-[confetti-fall_1.4s_ease-out_forwards] motion-reduce:hidden"
            style={
              {
                left: `${(i * 37) % 100}%`,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${(i % 6) * 60}ms`,
                "--drift": `${((i % 5) - 2) * 18}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      {children}
    </div>
  );
}
