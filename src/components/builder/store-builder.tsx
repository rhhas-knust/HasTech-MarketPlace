"use client";

import { useEffect, useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SignupProgress } from "@/components/signup-progress";
import { StorePreview } from "@/components/builder/store-preview";
import {
  BUSINESS_TYPE_OPTIONS,
  FOUNDING_FREE_MONTHS,
  FOUNDING_MEMBER_LIMIT,
} from "@/lib/constants";
import {
  ACCENT_SWATCHES,
  EMPTY_DRAFT,
  loadStoreDraft,
  saveStoreDraft,
  type StoreDraft,
} from "@/lib/store-draft";
import { cn } from "@/lib/cn";

const STEP_TITLES = [
  "What's your store called?",
  "What do you sell?",
  "Pick your brand colour",
  "Add your first product",
];

export function StoreBuilder({ spotsLeft }: { spotsLeft: number | null }) {
  const [draft, setDraft] = useState<StoreDraft>(EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = loadStoreDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    if (saved) setDraft(saved);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveStoreDraft(draft);
  }, [draft, loaded]);

  const update = (patch: Partial<StoreDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const done = step >= STEP_TITLES.length;
  const canContinue = step !== 0 || draft.name.trim().length >= 2;
  const hasFoundingSpots = spotsLeft !== null && spotsLeft > 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 sm:p-8">
        <SignupProgress current={0} />

        {!done ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canContinue) setStep((s) => s + 1);
            }}
          >
            <div
              key={step}
              className="enter"
              style={{ animationDuration: "350ms" }}
            >
              <p className="tabular-nums text-xs text-(--color-ink-muted)">
                Question {step + 1} of {STEP_TITLES.length}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-(--color-ink)">
                {STEP_TITLES[step]}
              </h1>

              <div className="mt-6 min-h-[180px]">
                {step === 0 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Store name</Label>
                      <Input
                        id="name"
                        value={draft.name}
                        maxLength={120}
                        onChange={(e) => update({ name: e.target.value })}
                        placeholder="e.g. Amara Books"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tagline">
                        One line about your store (optional)
                      </Label>
                      <Input
                        id="tagline"
                        value={draft.tagline}
                        maxLength={140}
                        onChange={(e) => update({ tagline: e.target.value })}
                        placeholder="e.g. Books, past questions and graduation sashes"
                      />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {BUSINESS_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={draft.businessType === opt.value}
                        onClick={() => update({ businessType: opt.value })}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors duration-150",
                          draft.businessType === opt.value
                            ? "border-(--color-brand) bg-(--color-brand-subtle)"
                            : "border-(--color-border) hover:border-(--color-border-strong)",
                        )}
                      >
                        <span className="block text-sm font-medium text-(--color-ink)">
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-(--color-ink-muted)">
                          {opt.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div className="flex flex-wrap gap-3">
                      {ACCENT_SWATCHES.map((color) => (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Use colour ${color}`}
                          aria-pressed={draft.accentColor === color}
                          onClick={() => update({ accentColor: color })}
                          className={cn(
                            "h-11 w-11 rounded-md",
                            draft.accentColor === color &&
                              "ring-2 ring-(--color-ink) ring-offset-2 ring-offset-(--color-surface)",
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <label className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-dashed border-(--color-border-strong) px-3 text-xs text-(--color-ink-muted) focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--color-brand) hover:text-(--color-ink)">
                        Custom
                        <input
                          type="color"
                          className="sr-only"
                          aria-label="Pick a custom colour"
                          value={draft.accentColor}
                          onChange={(e) =>
                            update({ accentColor: e.target.value })
                          }
                        />
                      </label>
                    </div>
                    <p className="mt-4 text-sm text-(--color-ink-muted)">
                      The preview updates as you choose. You can change this
                      later in Settings.
                    </p>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="productName">
                        Product or service name
                      </Label>
                      <Input
                        id="productName"
                        autoFocus
                        value={draft.productName}
                        maxLength={120}
                        onChange={(e) =>
                          update({ productName: e.target.value })
                        }
                        placeholder="e.g. Graduation sash"
                      />
                    </div>
                    <div>
                      <Label htmlFor="productPrice">Price (GHS)</Label>
                      <Input
                        id="productPrice"
                        inputMode="decimal"
                        value={draft.productPrice}
                        onChange={(e) =>
                          update({
                            productPrice: e.target.value.replace(
                              /[^0-9.]/g,
                              "",
                            ),
                          })
                        }
                        placeholder="45.00"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                {step === 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(4)}
                  >
                    Skip for now
                  </Button>
                )}
                <Button type="submit" disabled={!canContinue}>
                  {step === 3 ? "Finish" : "Continue"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="enter" style={{ animationDuration: "400ms" }}>
            <svg aria-hidden viewBox="0 0 48 48" className="mb-4 h-12 w-12">
              <circle
                cx="24"
                cy="24"
                r="24"
                className="fill-(--color-success-subtle)"
              />
              <path
                d="M15 24.5l6 6 12-13"
                fill="none"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={48}
                className="draw-check stroke-(--color-success)"
              />
            </svg>
            <h1 className="text-2xl font-semibold tracking-tight text-(--color-ink)">
              {draft.name.trim() || "Your store"} is ready
            </h1>
            <p className="mt-2 max-w-prose text-sm text-(--color-ink-muted)">
              Create an account to save it. Your name, colour and first product
              carry over to your real store, and you can change all of them
              later.
            </p>
            {hasFoundingSpots && (
              <p className="mt-4 rounded-md border border-(--color-border) bg-(--color-surface-subtle) px-3 py-2.5 text-sm text-(--color-ink)">
                Founding member offer: no platform fees for your first{" "}
                {FOUNDING_FREE_MONTHS} months.{" "}
                <span className="text-(--color-ink-muted)">
                  {spotsLeft} of {FOUNDING_MEMBER_LIMIT} places left.
                </span>
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <LinkButton href="/signup" size="lg">
                Create account
              </LinkButton>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => setStep(0)}
              >
                Edit design
              </Button>
            </div>
            <p className="mt-4 text-sm text-(--color-ink-muted)">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-medium text-(--color-brand) underline-offset-4 hover:underline"
              >
                Sign in
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-8">
        <p className="mb-3 text-center text-sm text-(--color-ink-muted)">
          Preview
        </p>
        <StorePreview draft={draft} />
      </div>
    </div>
  );
}
