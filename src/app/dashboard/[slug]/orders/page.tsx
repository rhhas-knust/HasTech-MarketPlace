import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Search, ShoppingBag } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreOrders, OPEN_FULFILMENT_STATUSES } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/money";
import { FULFILMENT_STATUS_LABELS } from "@/lib/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs, InitialsAvatar, PageHeader, formatShortDate } from "@/components/console/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Orders" };

type View = "all" | "todo" | "ready" | "completed" | "unpaid" | "cancelled";

const VIEWS: { value: View; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To fulfil" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "unpaid", label: "Awaiting payment" },
  { value: "cancelled", label: "Cancelled" },
];

type OrderRow = Awaited<ReturnType<typeof getStoreOrders>>[number];

function matchesView(order: OrderRow, view: View) {
  const open = (OPEN_FULFILMENT_STATUSES as readonly string[]).includes(order.fulfilment_status);
  switch (view) {
    case "todo":
      return order.payment_status === "paid" && open;
    case "ready":
      return order.fulfilment_status === "ready";
    case "completed":
      return order.fulfilment_status === "completed";
    case "unpaid":
      return order.payment_status !== "paid" && order.fulfilment_status !== "cancelled";
    case "cancelled":
      return order.fulfilment_status === "cancelled" || order.fulfilment_status === "refunded";
    default:
      return true;
  }
}

function statusPill(order: OrderRow) {
  if (order.payment_status === "failed") return { label: "Payment failed", tone: "bg-(--color-danger-subtle) text-(--color-danger)", dot: "bg-(--color-danger)" };
  if (order.payment_status !== "paid" && order.fulfilment_status !== "cancelled")
    return { label: "Awaiting payment", tone: "bg-(--color-warning-subtle) text-(--color-warning)", dot: "bg-(--color-warning)" };
  if (order.fulfilment_status === "completed")
    return { label: "Completed", tone: "bg-(--color-success-subtle) text-(--color-success)", dot: "bg-(--color-success)" };
  if (order.fulfilment_status === "cancelled" || order.fulfilment_status === "refunded")
    return { label: FULFILMENT_STATUS_LABELS[order.fulfilment_status], tone: "bg-(--color-surface-subtle) text-(--color-ink-muted)", dot: "bg-(--color-ink-muted)" };
  return { label: FULFILMENT_STATUS_LABELS[order.fulfilment_status], tone: "bg-(--color-brand-subtle) text-(--color-brand)", dot: "bg-(--color-brand)" };
}

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { view: rawView, q = "" } = await searchParams;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const view: View = VIEWS.some((v) => v.value === rawView) ? (rawView as View) : "all";
  const orders = await getStoreOrders(membership.store.id);

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Sales" title="Orders" />
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" />}
          title="No orders yet"
          description="Orders will show up here as soon as customers start buying."
        />
      </div>
    );
  }

  const needle = q.trim().toLowerCase();
  const rows = orders.map((order) => {
    const customer = order.customers as unknown as { first_name: string | null; last_name: string | null; email: string | null } | null;
    const name = [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || customer?.email || "Customer";
    return { order, customer, name };
  });
  const visible = rows.filter(({ order, customer, name }) => {
    if (!matchesView(order, view)) return false;
    if (!needle) return true;
    return [order.order_number, name, customer?.email ?? ""].some((v) => v.toLowerCase().includes(needle));
  });

  const hrefFor = (next: View) => {
    const qs = new URLSearchParams();
    if (next !== "all") qs.set("view", next);
    if (q) qs.set("q", q);
    const s = qs.toString();
    return `/dashboard/${slug}/orders${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Sales" title="Orders" description="Every order placed in your store, newest first.">
        <form action={`/dashboard/${slug}/orders`} className="w-full sm:w-72">
          {view !== "all" && <input type="hidden" name="view" value={view} />}
          <label className="flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2.5 shadow-soft transition focus-within:border-(--color-brand) focus-within:ring-4 focus-within:ring-(--color-brand)/15">
            <Search className="h-4 w-4 text-(--color-ink-muted)" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Order number or customer"
              className="w-full bg-transparent text-sm text-(--color-ink) outline-none placeholder:text-(--color-ink-muted)"
              aria-label="Search orders"
            />
          </label>
        </form>
      </PageHeader>

      <FilterTabs
        tabs={VIEWS.map((v) => ({
          href: hrefFor(v.value),
          label: v.label,
          count: orders.filter((o) => matchesView(o, v.value)).length,
          active: view === v.value,
        }))}
      />

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-(--color-border) bg-(--color-surface)/60 px-6 py-14 text-center text-sm text-(--color-ink-muted)">
          {view === "todo" && !needle ? "🎉 All caught up. No orders waiting to be fulfilled." : "No orders match this view."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-(--color-border)/70 bg-(--color-surface) shadow-soft">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-(--color-surface-subtle)/70 text-left text-xs uppercase tracking-wider text-(--color-ink-muted)">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Customer</th>
                <th className="px-5 py-3.5 font-semibold">Order</th>
                <th className="px-5 py-3.5 font-semibold">Total</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)/70">
              {visible.map(({ order, customer, name }) => {
                const pill = statusPill(order);
                return (
                  <tr key={order.id} className="transition-colors hover:bg-(--color-surface-subtle)/60">
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/${slug}/orders/${order.id}`} className="flex items-center gap-3">
                        <InitialsAvatar name={name} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-(--color-ink)">{name}</p>
                          {customer?.email && <p className="truncate text-xs text-(--color-ink-muted)">{customer.email}</p>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/${slug}/orders/${order.id}`}
                        className="font-mono text-sm font-medium text-(--color-brand) hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-(--color-ink) tabular-nums">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", pill.tone)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", pill.dot)} />
                        {pill.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-(--color-ink-muted)">{formatShortDate(order.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
