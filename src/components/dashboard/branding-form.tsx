"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldHint } from "@/components/ui/input";
import type { SettingsFormState } from "@/app/dashboard/[slug]/settings/actions";

const PRESET_COLORS = ["#4338CA", "#0F766E", "#B45309", "#BE123C", "#1D4ED8", "#15803D"];

export function BrandingForm({
  storeName,
  logoUrl,
  accentColor,
  colorAction,
  logoAction,
  removeLogoAction,
}: {
  storeName: string;
  logoUrl: string | null;
  accentColor: string;
  colorAction: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  logoAction: (formData: FormData) => Promise<{ error?: string }>;
  removeLogoAction: () => Promise<void>;
}) {
  const [colorState, colorFormAction, colorPending] = useActionState<SettingsFormState, FormData>(colorAction, {});
  const [color, setColor] = useState(accentColor);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const [removing, startRemove] = useTransition();

  return (
    <div className="space-y-6">
      <div>
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
          ) : (
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {storeName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex-1">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setLogoError(null);
                const formData = new FormData();
                formData.set("file", file);
                startUpload(async () => {
                  const result = await logoAction(formData);
                  if (result.error) setLogoError(result.error);
                });
                e.target.value = "";
              }}
            />
            <FieldHint>
              {logoUrl
                ? uploading
                  ? "Uploading…"
                  : "JPEG, PNG or WEBP, up to 2MB."
                : "No logo yet — customers see your initial in your accent colour instead."}
            </FieldHint>
            {logoError && <p className="mt-1 text-sm text-(--color-danger)">{logoError}</p>}
            {logoUrl && (
              <button
                type="button"
                className="mt-1 text-sm text-(--color-danger) disabled:opacity-50"
                disabled={removing}
                onClick={() => startRemove(() => removeLogoAction())}
              >
                {removing ? "Removing…" : "Remove logo"}
              </button>
            )}
          </div>
        </div>
      </div>

      <form action={colorFormAction} className="space-y-3">
        <Label htmlFor="accentColorPicker">Accent colour</Label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="h-8 w-8 rounded-full border-2"
              style={{
                backgroundColor: preset,
                borderColor: color.toLowerCase() === preset.toLowerCase() ? "var(--color-ink)" : "transparent",
              }}
              onClick={() => setColor(preset)}
              aria-label={`Use ${preset}`}
            />
          ))}
          <input
            id="accentColorPicker"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-(--color-border) bg-transparent p-0"
            aria-label="Custom accent colour"
          />
          <input type="hidden" name="accentColor" value={color} />
        </div>
        <FieldHint>Used for buttons and headers on your storefront, and for your initials logo above.</FieldHint>
        {colorState.error && <p className="text-sm text-(--color-danger)">{colorState.error}</p>}
        {colorState.success && <p className="text-sm text-(--color-success)">Saved.</p>}
        <Button type="submit" size="sm" disabled={colorPending}>
          {colorPending ? "Saving…" : "Save colour"}
        </Button>
      </form>
    </div>
  );
}
