"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { DailyPoint } from "@/lib/dashboard-data";

const BRAND = "var(--color-brand)";
const GRID = "var(--color-border)";
const AXIS_TEXT = "var(--color-ink-muted)";

function formatDay(date: string) {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function RevenueChart({ data, currency }: { data: DailyPoint[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          tick={{ fill: AXIS_TEXT, fontSize: 12 }}
          axisLine={{ stroke: GRID }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: AXIS_TEXT, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          formatter={(value) => [`${currency} ${Number(value).toFixed(2)}`, "Revenue"]}
          labelFormatter={(label) => formatDay(String(label))}
          contentStyle={{ borderRadius: 12, border: `1px solid ${GRID}`, fontSize: 13, background: "var(--color-surface)", color: "var(--color-ink)" }}
        />
        <Bar dataKey="value" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ViewsChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          tick={{ fill: AXIS_TEXT, fontSize: 12 }}
          axisLine={{ stroke: GRID }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: AXIS_TEXT, fontSize: 12 }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
        <Tooltip
          formatter={(value) => [String(value), "Views"]}
          labelFormatter={(label) => formatDay(String(label))}
          contentStyle={{ borderRadius: 12, border: `1px solid ${GRID}`, fontSize: 13, background: "var(--color-surface)", color: "var(--color-ink)" }}
        />
        <Line type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
