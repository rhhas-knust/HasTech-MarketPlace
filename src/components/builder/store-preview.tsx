import { Briefcase, FileDown, Landmark, Package, Palette, Scissors, ShoppingBag, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { ctaLabelForBusinessType } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import type { StoreDraft } from "@/lib/store-draft";

const TYPE_ICON: Record<string, LucideIcon> = {
  retail: ShoppingBag,
  service: Scissors,
  digital_product: FileDown,
  restaurant: UtensilsCrossed,
  professional_service: Briefcase,
  creator: Palette,
  organisation: Landmark,
  other: Package,
};

function formatPrice(raw: string) {
  const n = Number(raw);
  if (!raw || Number.isNaN(n)) return "GHS 0.00";
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StorePreview({ draft }: { draft: StoreDraft }) {
  const name = draft.name.trim() || "Your Store";
  const slug = slugify(draft.name) || "your-store";
  const Icon = TYPE_ICON[draft.businessType] ?? Package;

  return (
    <div className="mx-auto w-full max-w-[300px] rounded-xl border border-(--color-border) bg-(--color-surface) shadow-raised">
      <div className="overflow-hidden rounded-xl">
        <div className="truncate bg-(--color-surface-subtle) px-4 py-1.5 text-center tabular-nums text-xs text-(--color-ink-muted)">
          /store/{slug}
        </div>
        <div className="px-4 pb-5 pt-4 text-white transition-colors duration-300" style={{ backgroundColor: draft.accentColor }}>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-sm font-semibold">{name}</span>
          </div>
          <p className="mt-3 line-clamp-2 text-xs text-white/85">
            {draft.tagline.trim() || "Welcome! Browse, order and pay in a few taps."}
          </p>
        </div>
        <div className="space-y-3 p-4">
          <div className="rounded-lg border border-(--color-border) p-3">
            <div className="flex h-24 items-center justify-center rounded-md bg-(--color-surface-subtle) text-(--color-ink-muted)">
              <Icon className="h-8 w-8" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="mt-2 truncate text-sm font-medium text-(--color-ink)">
              {draft.productName.trim() || "Your first product"}
            </p>
            <p className="tabular-nums text-sm text-(--color-ink-muted) tabular-nums">{formatPrice(draft.productPrice)}</p>
            <span
              className="mt-2 block rounded-full py-1.5 text-center text-xs font-medium text-white transition-colors duration-300"
              style={{ backgroundColor: draft.accentColor }}
            >
              {ctaLabelForBusinessType(draft.businessType)}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-(--color-ink-muted)">
            <span>Pay with</span>
            <span className="rounded bg-(--color-surface-subtle) px-1.5 py-0.5 font-medium">MoMo</span>
            <span className="rounded bg-(--color-surface-subtle) px-1.5 py-0.5 font-medium">Card</span>
          </div>
        </div>
      </div>
    </div>
  );
}
