"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Odometer-style number: every digit in `text` rolls into place on its own
 * strip when it scrolls into view, and rolls again whenever the value
 * changes. Non-digit characters (currency, commas, %, dots) render as-is.
 */
export function RollingDigits({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const chars = text.split("");
  let digitIndex = 0;

  return (
    <span ref={ref} className={cn("inline-flex items-center font-mono tabular-nums leading-none", className)} aria-label={text}>
      {chars.map((char, i) => {
        if (!/\d/.test(char)) {
          return (
            <span key={`s-${i}`} aria-hidden className="inline-block h-[1.2em] leading-[1.2em]">
              {char === " " ? " " : char}
            </span>
          );
        }
        const position = digitIndex++;
        const target = visible ? Number(char) : 0;
        return (
          <span
            key={`d-${chars.length - i}`}
            aria-hidden
            className="relative inline-block h-[1.2em] overflow-hidden [clip-path:inset(0)]"
            style={{ width: "1ch" }}
          >
            <span
              className="absolute left-0 top-0 flex w-full flex-col transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
              style={{
                transform: `translateY(-${target * 10}%)`,
                transitionDelay: `${position * 60}ms`,
              }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1.2em] text-center leading-[1.2em]">
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
