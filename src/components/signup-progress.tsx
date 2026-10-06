import { cn } from "@/lib/cn";

const STEPS = ["Design", "Account", "Verify email", "Store details"];

/** Shared across /start, /signup, /verify-email and /onboarding. */
export function SignupProgress({ current }: { current: number }) {
  return (
    <nav aria-label="Setup progress" className="mb-6">
      <p className="text-sm text-(--color-ink-muted)">
        Step {current + 1} of {STEPS.length}:{" "}
        <span className="font-medium text-(--color-ink)">{STEPS[current]}</span>
      </p>
      <ol className="mt-2 grid grid-cols-4 gap-1.5">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === current ? "step" : undefined}>
            <span aria-hidden className="block h-1 overflow-hidden rounded-full bg-(--color-border)">
              {i <= current && (
                <span
                  className={cn(
                    "block h-full origin-left rounded-full bg-(--color-brand)",
                    // Only the step just reached fills in; earlier ones are already full.
                    i === current && "progress-fill",
                  )}
                />
              )}
            </span>
            <span className="sr-only">
              {label}
              {i < current ? ", done" : i === current ? ", current step" : ""}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
