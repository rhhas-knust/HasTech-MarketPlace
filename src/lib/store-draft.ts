import type { BusinessType } from "@/lib/types/database";

/**
 * The store a visitor designs at /start before they have an account. It
 * lives only in their browser until they sign up, then prefills onboarding
 * so none of the work they put in is lost.
 */
export interface StoreDraft {
  name: string;
  businessType: BusinessType;
  accentColor: string;
  tagline: string;
  productName: string;
  productPrice: string;
}

const STORAGE_KEY = "hastech_store_draft";

export const ACCENT_SWATCHES = ["#4338ca", "#0f766e", "#b91c1c", "#c2410c", "#7e22ce", "#0f172a"];

export const EMPTY_DRAFT: StoreDraft = {
  name: "",
  businessType: "retail",
  accentColor: ACCENT_SWATCHES[0],
  tagline: "",
  productName: "",
  productPrice: "",
};

export function loadStoreDraft(): StoreDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<StoreDraft>) };
  } catch {
    return null;
  }
}

export function saveStoreDraft(draft: StoreDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {}
}

export function clearStoreDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
