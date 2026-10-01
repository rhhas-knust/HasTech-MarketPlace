import { ctaLabelForBusinessType } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import type { StoreDraft } from "@/lib/store-draft";

const TYPE_EMOJI: Record<string, string> = {
  retail: "🛍️",
  service: "✂️",
  digital_product: "📘",
  restaurant: "🍲",
  professional_service: "💼",
  creator: "🎨",
  organisation: "🏛️",
  other: "✨",
};

function formatPrice(raw: string) {
  const n = Number(raw);
  if (!raw || Number.isNaN(n)) return "GHS 0.00";
  return `GHS ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StorePreview({ draft }: { draft: StoreDraft }) {
  const name = draft.name.trim() || "Your Store";
  const slug = slugify(draft.name) || "your-store";
  const emoji = TYPE_EMOJI[draft.businessType] ?? "✨";

  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[2.4rem] border-[7px] border-(--color-ink) bg-(--color-surface) p-0 shadow-lift ring-1 ring-black/5 motion-safe:animate-[float-slow_7s_ease-in-out_infinite]">
      <div className="overflow-hidden rounded-[1.9rem]">
        <div className="truncate bg-(--color-surface-subtle) px-4 py-1.5 text-center font-mono text-[10px] text-(--color-ink-muted)">
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
          <div className="rounded-2xl border border-(--color-border)/70 p-3 shadow-soft">
            <div className="flex h-24 items-center justify-center rounded-xl bg-(--color-surface-subtle) text-4xl">
              {emoji}
            </div>
            <p className="mt-2 truncate text-sm font-medium text-(--color-ink)">
              {draft.productName.trim() || "Your first product"}
            </p>
            <p className="font-mono text-sm text-(--color-ink-muted) tabular-nums">{formatPrice(draft.productPrice)}</p>
            <span
              className="mt-2 block rounded-full py-1.5 text-center text-xs font-medium text-white transition-colors duration-300"
              style={{ backgroundColor: draft.accentColor }}
            >
              {ctaLabelForBusinessType(draft.businessType)}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-(--color-ink-muted)">
            <span>Pay with</span>
            <span className="rounded bg-(--color-surface-subtle) px-1.5 py-0.5 font-medium">MoMo</span>
            <span className="rounded bg-(--color-surface-subtle) px-1.5 py-0.5 font-medium">Card</span>
          </div>
        </div>
      </div>
    </div>
  );
}
