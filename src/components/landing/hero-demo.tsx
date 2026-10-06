"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, GraduationCap, ShoppingBag } from "lucide-react";
import { readableTextOn } from "@/lib/color";

// A short loop that shows what selling looks like: a seller's colour, a
// customer adding to cart, and the order notification arriving. It explains
// the product, so it is allowed to be slower than UI motion; it pauses when
// off screen or in a background tab, and stays still under reduced motion.

const ACCENTS = ["#0f766e", "#5b39a8", "#c2410c", "#1d4ed8"];

type Phase = "idle" | "pressed" | "notified";

const TIMELINE: { phase: Phase; at: number }[] = [
  { phase: "idle", at: 0 },
  { phase: "pressed", at: 1600 },
  { phase: "notified", at: 2300 },
];
const LOOP_MS = 6200;

export function HeroDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("notified");
  const [loop, setLoop] = useState(0);
  const [running, setRunning] = useState(false);

  // Only animate while visible, the tab is active, and motion is allowed.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => setRunning(visible && !document.hidden && !reduce.matches);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", update);
    reduce.addEventListener("change", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timers = TIMELINE.map(({ phase: p, at }) => window.setTimeout(() => setPhase(p), at));
    timers.push(window.setTimeout(() => setLoop((n) => n + 1), LOOP_MS));
    return () => timers.forEach(clearTimeout);
  }, [running, loop]);

  const accent = ACCENTS[loop % ACCENTS.length];
  const onAccent = readableTextOn(accent);
  const orderNumber = 1043 + loop;
  const ordersToday = 3 + loop;
  const notified = phase === "notified";
  const pressed = phase !== "idle";
  const shownOrders = notified ? ordersToday : ordersToday - 1;

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-[340px] pt-16 pb-12">
      {/* Order notification */}
      <div
        aria-hidden
        className="absolute inset-x-4 top-0 z-10 flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-3 shadow-raised"
        style={{
          opacity: notified ? 1 : 0,
          transform: notified ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.97)",
          transition: notified
            ? "opacity 400ms var(--ease-out), transform 500ms var(--ease-out)"
            : "opacity 200ms ease, transform 200ms ease",
        }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--color-success-subtle) text-(--color-success)">
          <ShoppingBag className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-(--color-ink)">New order HT-{orderNumber}</span>
          <span className="block text-xs text-(--color-ink-muted)">GHS 45.00, paid with MoMo</span>
        </span>
        <span className="text-xs tabular-nums text-(--color-ink-muted)">now</span>
      </div>

      {/* Store page */}
      <div
        aria-hidden
        className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-raised"
      >
        <div className="flex items-center gap-1.5 border-b border-(--color-border) bg-(--color-surface-subtle) px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-(--color-border-strong)" />
          <span className="h-2 w-2 rounded-full bg-(--color-border-strong)" />
          <span className="h-2 w-2 rounded-full bg-(--color-border-strong)" />
          <span className="ml-2 truncate text-xs text-(--color-ink-muted)">/store/amara-books</span>
        </div>

        <div className="px-4 pt-4">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold"
              style={{ backgroundColor: accent, color: onAccent, transition: "background-color 600ms ease, color 600ms ease" }}
            >
              A
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-(--color-ink)">Amara Books</p>
              <p className="truncate text-xs text-(--color-ink-muted)">Textbooks and graduation wear, Accra</p>
            </div>
          </div>
          <span
            className="mt-4 block h-1 w-10 rounded-sm"
            style={{ backgroundColor: accent, transition: "background-color 600ms ease" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 p-4">
          {[
            { name: "Graduation sash", price: "GHS 45.00", Icon: GraduationCap, active: true },
            { name: "WASSCE past questions", price: "GHS 30.00", Icon: BookOpen, active: false },
          ].map(({ name, price, Icon, active }) => (
            <div key={name} className="rounded-xl border border-(--color-border) p-2.5">
              <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-(--color-surface-subtle) text-(--color-ink-muted)">
                <Icon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="mt-2 truncate text-xs font-medium text-(--color-ink)">{name}</p>
              <p className="text-xs tabular-nums text-(--color-ink-muted)">{price}</p>
              <span
                className="mt-2 flex h-7 items-center justify-center gap-1 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: accent,
                  color: onAccent,
                  transform: active && phase === "pressed" ? "scale(0.96)" : "scale(1)",
                  transition: "transform 160ms var(--ease-out), background-color 600ms ease, color 600ms ease",
                }}
              >
                {active && pressed ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Added
                  </>
                ) : (
                  "Add to Cart"
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Seller's counter */}
      <div
        aria-hidden
        className="absolute right-3 bottom-0 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2 shadow-raised sm:-right-6"
      >
        <p className="text-xs text-(--color-ink-muted)">Orders today</p>
        <p key={shownOrders} className="enter text-lg font-semibold tabular-nums text-(--color-ink)" style={{ animationDuration: "400ms" }}>
          {shownOrders}
        </p>
      </div>

      <p className="sr-only">
        Example: a customer adds a graduation sash to their cart on a store page and the seller is notified of the paid
        order.
      </p>
    </div>
  );
}
