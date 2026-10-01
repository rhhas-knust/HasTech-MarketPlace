"use client";

import { useEffect, useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SignupProgress } from "@/components/signup-progress";
import { GiftBox } from "@/components/gift-box";
import { StorePreview } from "@/components/builder/store-preview";
import { BUSINESS_TYPE_OPTIONS, FOUNDING_MEMBER_LIMIT } from "@/lib/constants";
import { ACCENT_SWATCHES, EMPTY_DRAFT, loadStoreDraft, saveStoreDraft, type StoreDraft } from "@/lib/store-draft";
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

  const update = (patch: Partial<StoreDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const done = step >= STEP_TITLES.length;
  const canContinue = step !== 0 || draft.name.trim().length >= 2;
  const hasFoundingSpots = spotsLeft !== null && spotsLeft > 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-lg shadow-black/5">
        <SignupProgress current={0} percent={10 + Math.min(step, 4) * 6} />

        {!done ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canContinue) setStep((s) => s + 1);
            }}
          >
            <p className="font-mono text-xs text-(--color-ink-muted)">
              Step {step + 1} of {STEP_TITLES.length}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-(--color-ink)">{STEP_TITLES[step]}</h1>

            <div className="mt-6 min-h-[180px]">
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Store name</Label>
                    <Input
                      id="name"
                      autoFocus
                      value={draft.name}
                      maxLength={120}
                      onChange={(e) => update({ name: e.target.value })}
                      placeholder="e.g. Amara Books"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tagline">One line about your store (optional)</Label>
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
                      onClick={() => update({ businessType: opt.value })}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-colors",
                        draft.businessType === opt.value
                          ? "border-(--color-brand) bg-(--color-brand-subtle)"
                          : "border-(--color-border) hover:border-(--color-brand)",
                      )}
                    >
                      <span className="block text-sm font-medium text-(--color-ink)">{opt.label}</span>
                      <span className="mt-0.5 block text-xs text-(--color-ink-muted)">{opt.description}</span>
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
                        onClick={() => update({ accentColor: color })}
                        className={cn(
                          "h-12 w-12 rounded-full transition-transform hover:scale-110",
                          draft.accentColor === color && "ring-4 ring-(--color-brand) ring-offset-2 ring-offset-(--color-surface)",
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-(--color-border) text-xs text-(--color-ink-muted) hover:border-(--color-brand)">
                      <span aria-hidden>+</span>
                      <input
                        type="color"
                        className="sr-only"
                        aria-label="Pick a custom colour"
                        value={draft.accentColor}
                        onChange={(e) => update({ accentColor: e.target.value })}
                      />
                    </label>
                  </div>
                  <p className="mt-4 text-sm text-(--color-ink-muted)">
                    Watch your store change on the right. You can fine-tune this any time.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="productName">Product or service name</Label>
                    <Input
                      id="productName"
                      autoFocus
                      value={draft.productName}
                      maxLength={120}
                      onChange={(e) => update({ productName: e.target.value })}
                      placeholder="e.g. Graduation sash"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productPrice">Price (GHS)</Label>
                    <Input
                      id="productPrice"
                      inputMode="decimal"
                      value={draft.productPrice}
                      onChange={(e) => update({ productPrice: e.target.value.replace(/[^0-9.]/g, "") })}
                      placeholder="45.00"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                  &larr; Back
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                {step === 3 && (
                  <Button type="button" variant="ghost" onClick={() => setStep(4)}>
                    Skip for now
                  </Button>
                )}
                <Button type="submit" disabled={!canContinue}>
                  {step === 3 ? "Finish my store" : "Continue"} &rarr;
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold text-(--color-ink)">
              🎉 {draft.name.trim() || "Your store"} is ready to go live
            </h1>
            <p className="mt-2 text-sm text-(--color-ink-muted)">
              You built this. Create your account to claim it, and everything you designed is
              saved straight into your real store.
            </p>

            <div className="mt-6">
              <GiftBox label="You unlocked a welcome gift. Tap to open">
                {hasFoundingSpots ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--color-brand)">
                      Founding member gift
                    </p>
                    <p className="mt-1 text-lg font-semibold text-(--color-ink)">
                      No platform fees for the rest of this month
                    </p>
                    <p className="mt-1 text-sm text-(--color-ink-muted)">
                      Only {spotsLeft} of {FOUNDING_MEMBER_LIMIT} founding spots are left. Claim your
                      store to lock it in.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-(--color-brand)">
                      Launch kit
                    </p>
                    <p className="mt-1 text-lg font-semibold text-(--color-ink)">
                      A ready-made launch announcement
                    </p>
                    <p className="mt-1 text-sm text-(--color-ink-muted)">
                      Your store link plus a WhatsApp message written for you, waiting in your dashboard.
                    </p>
                  </>
                )}
              </GiftBox>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/signup" size="lg" className="w-full sm:flex-1">
                Claim my store &rarr;
              </LinkButton>
              <Button type="button" size="lg" variant="outline" onClick={() => setStep(0)}>
                Edit design
              </Button>
            </div>
            <p className="mt-3 text-center text-xs text-(--color-ink-muted)">
              Already have an account?{" "}
              <a href="/login" className="font-medium text-(--color-brand)">
                Sign in
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-8">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-(--color-ink-muted)">
          Live preview
        </p>
        <StorePreview draft={draft} />
      </div>
    </div>
  );
}
