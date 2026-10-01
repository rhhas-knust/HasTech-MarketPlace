import { cn } from "@/lib/cn";

const STEPS = ["Start", "Account", "Verify", "Launch"];

/**
 * Shared across /start → /signup → /verify-email → /onboarding. The bar is
 * never empty (the first step is already ticked when you arrive) and the
 * gift sits at the finish line, so every step visibly moves you toward it.
 */
export function SignupProgress({ current, percent }: { current: number; percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="mb-6" aria-label={`Setup progress: ${Math.round(clamped)}%`}>
      <div className="flex items-center gap-3">
        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-(--color-surface-subtle) ring-1 ring-inset ring-(--color-border)">
          <div
            className="h-full rounded-full bg-brand-gradient shadow-glow transition-[width] duration-700 ease-out"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span
          className="text-xl motion-safe:animate-[gift-wiggle_3s_ease-in-out_infinite]"
          role="img"
          aria-label="A welcome gift unlocks when you launch"
          title="A welcome gift unlocks when you launch"
        >
          🎁
        </span>
      </div>
      <ol className="mt-2 flex justify-between pr-8 text-[11px]">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-1",
              i < current && "text-(--color-success)",
              i === current && "font-semibold text-(--color-brand)",
              i > current && "text-(--color-ink-muted)",
            )}
          >
            {i < current ? "✓" : <span className="font-mono">{i + 1}</span>}
            <span>{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
