"use client";

import { useEffect, useState } from "react";
import { RollingDigits } from "@/components/rolling-digits";

const SAMPLE_ORDERS = [
  { customer: "Ama K.", item: "Graduation sash", amount: 45 },
  { customer: "Kwame O.", item: "Physics past questions", amount: 30 },
  { customer: "Efua M.", item: "Logo design (PSD)", amount: 150 },
  { customer: "Yaw B.", item: "Haircut booking", amount: 40 },
  { customer: "Akosua D.", item: "Jollof combo", amount: 65 },
  { customer: "Kofi A.", item: "Phone case", amount: 25 },
];

interface FeedItem {
  id: number;
  customer: string;
  item: string;
  amount: number;
}

function formatGhs(amount: number) {
  return `GHS ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function LiveDemoDashboard() {
  const [revenue, setRevenue] = useState(4280);
  const [orders, setOrders] = useState(52);
  const [visitors, setVisitors] = useState(1204);
  const [feed, setFeed] = useState<FeedItem[]>([
    { id: 1, ...SAMPLE_ORDERS[0] },
    { id: 0, ...SAMPLE_ORDERS[1] },
  ]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tick = 2;
    const visitorTimer = setInterval(() => {
      setVisitors((v) => v + 1 + Math.floor(Math.random() * 3));
    }, 1400);
    const orderTimer = setInterval(() => {
      const sample = SAMPLE_ORDERS[tick % SAMPLE_ORDERS.length];
      const id = tick++;
      setRevenue((r) => r + sample.amount);
      setOrders((o) => o + 1);
      setFeed((f) => [{ id, ...sample }, ...f].slice(0, 3));
    }, 3200);
    return () => {
      clearInterval(visitorTimer);
      clearInterval(orderTimer);
    };
  }, []);

  const conversion = ((orders / visitors) * 100).toFixed(1);

  return (
    <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-xl shadow-black/5">
      <div className="flex items-center justify-between border-b border-(--color-border) px-5 py-3">
        <span className="text-sm font-medium text-(--color-ink)">Your dashboard</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-success-subtle) px-2.5 py-0.5 text-xs font-medium text-(--color-success)">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-success)" />
          </span>
          Live demo
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-(--color-border)">
        {[
          { label: "Revenue", text: formatGhs(revenue) },
          { label: "Orders", text: String(orders) },
          { label: "Visitors", text: visitors.toLocaleString("en-GH") },
          { label: "Conversion", text: `${conversion}%` },
        ].map((stat) => (
          <div key={stat.label} className="bg-(--color-surface) px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-(--color-ink-muted)">
              {stat.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-(--color-ink) sm:text-3xl">
              <RollingDigits text={stat.text} />
            </p>
          </div>
        ))}
      </div>

      <ul className="divide-y divide-(--color-border) border-t border-(--color-border)">
        {feed.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 px-5 py-3 text-sm motion-safe:animate-[feed-in_400ms_ease-out]"
          >
            <span className="min-w-0 truncate text-(--color-ink)">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-(--color-success-subtle) text-[11px] text-(--color-success)">
                ✓
              </span>
              {item.customer} paid for <span className="font-medium">{item.item}</span>
            </span>
            <span className="shrink-0 font-mono text-(--color-success) tabular-nums">
              +{formatGhs(item.amount)}
            </span>
          </li>
        ))}
      </ul>
      <p className="border-t border-(--color-border) bg-(--color-surface-subtle) px-5 py-2 text-center text-[11px] text-(--color-ink-muted)">
        Example data — this is what your real dashboard looks like once orders come in.
      </p>
    </div>
  );
}
