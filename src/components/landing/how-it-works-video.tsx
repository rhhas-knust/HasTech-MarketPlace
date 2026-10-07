"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

const CHAPTERS = [
  { title: "Design your store", body: "Pick a name, a colour and your first product. No account needed for this part.", start: 3 },
  { title: "Connect Paystack", body: "Paste your Paystack keys in Settings so customers pay you directly.", start: 16 },
  { title: "Share your link", body: "Publish, share on WhatsApp, and get told the moment an order is paid.", start: 25 },
];

function chapterAt(time: number) {
  let current = -1;
  CHAPTERS.forEach((c, i) => {
    if (time >= c.start) current = i;
  });
  return current;
}

/**
 * The 44-second walkthrough with its three steps as chapter buttons. Picking
 * a step jumps the video there; the current step stays highlighted while it
 * plays. Silent by design; captions are available from the player controls.
 */
export function HowItWorksVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(-1);

  const jump = (i: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = CHAPTERS[i].start;
    setCurrent(i);
    video.play().catch(() => {});
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:items-center">
      <ol className="space-y-2" aria-label="Video chapters">
        {CHAPTERS.map((chapter, i) => (
          <li key={chapter.title}>
            <button
              type="button"
              onClick={() => jump(i)}
              aria-current={current === i ? "step" : undefined}
              className={cn(
                "flex w-full gap-4 rounded-xl border p-4 text-left transition-[border-color,background-color] duration-200",
                current === i
                  ? "border-(--color-brand) bg-(--color-brand-subtle)"
                  : "border-transparent hover:border-(--color-border)",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors duration-200",
                  current === i
                    ? "bg-(--color-brand) text-(--color-on-brand)"
                    : "bg-(--color-surface-subtle) text-(--color-ink)",
                )}
              >
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold text-(--color-ink)">{chapter.title}</span>
                <span className="mt-1 block text-sm text-(--color-ink-muted)">{chapter.body}</span>
                <span className="mt-1.5 block text-xs font-medium text-(--color-brand)">
                  Watch from 0:{String(chapter.start).padStart(2, "0")}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-raised">
        <video
          ref={videoRef}
          className="block aspect-video w-full"
          controls
          muted
          playsInline
          preload="metadata"
          poster="/videos/how-it-works-poster.jpg"
          onTimeUpdate={(e) => setCurrent(chapterAt(e.currentTarget.currentTime))}
          aria-label="How to open a store on HASTECH Commerce, in three steps"
        >
          {/* H.264 for Safari, Chrome and Edge; VP9 for browsers built without H.264. */}
          <source src="/videos/how-it-works.mp4" type='video/mp4; codecs="avc1.64001F"' />
          <source src="/videos/how-it-works.webm" type='video/webm; codecs="vp9"' />
          <track kind="captions" src="/videos/how-it-works.en.vtt" srcLang="en" label="English" />
        </video>
      </div>
    </div>
  );
}
