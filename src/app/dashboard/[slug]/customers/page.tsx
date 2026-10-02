import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Crown, Mail, MessageCircle, Phone, Search, Users } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreCustomers } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/money";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs, InitialsAvatar, PageHeader } from "@/components/console/ui";

export const metadata: Metadata = { title: "Customers" };

type Tab = "all" | "top" | "repeat";

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "top", label: "Top spenders" },
  { value: "repeat", label: "Repeat customers" },
];

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `233${digits.slice(1)}` : digits}`;
}

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { tab: rawTab, q = "" } = await searchParams;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const tab: Tab = TABS.some((t) => t.value === rawTab) ? (rawTab as Tab) : "all";
  const customers = await getStoreCustomers(membership.store.id);

  if (customers.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="People" title="Customers" />
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No customers yet"
          description="Customers appear here after their first order."
        />
      </div>
    );
  }

  const rows = customers.map((customer) => {
    const orders = (customer.orders as unknown as { total: number; payment_status: string }[]) ?? [];
    const paid = orders.filter((o) => o.payment_status === "paid");
    return {
      customer,
      name: [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email || "Customer",
      paidOrders: paid.length,
      totalSpent: paid.reduce((sum, o) => sum + Number(o.total), 0),
    };
  });
  const topSpend = Math.max(0, ...rows.map((r) => r.totalSpent));

  const needle = q.trim().toLowerCase();
  const inTab = (r: (typeof rows)[number], t: Tab) => (t === "top" ? r.totalSpent > 0 : t === "repeat" ? r.paidOrders >= 2 : true);
  let visible = rows.filter(
    (r) =>
      inTab(r, tab) &&
      (!needle || [r.name, r.customer.email ?? "", r.customer.phone ?? ""].some((v) => v.toLowerCase().includes(needle))),
  );
  if (tab === "top") visible = [...visible].sort((a, b) => b.totalSpent - a.totalSpent);

  const hrefFor = (next: Tab) => {
    const qs = new URLSearchParams();
    if (next !== "all") qs.set("tab", next);
    if (q) qs.set("q", q);
    const s = qs.toString();
    return `/dashboard/${slug}/customers${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="People" title="Customers" description="Everyone who has ordered from your store.">
        <form action={`/dashboard/${slug}/customers`} className="w-full sm:w-72">
          {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
          <label className="flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2.5 shadow-soft transition focus-within:border-(--color-brand) focus-within:ring-4 focus-within:ring-(--color-brand)/15">
            <Search className="h-4 w-4 text-(--color-ink-muted)" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Name, email or phone"
              className="w-full bg-transparent text-sm text-(--color-ink) outline-none placeholder:text-(--color-ink-muted)"
              aria-label="Search customers"
            />
          </label>
        </form>
      </PageHeader>

      <FilterTabs
        tabs={TABS.map((t) => ({
          href: hrefFor(t.value),
          label: t.label,
          count: rows.filter((r) => inTab(r, t.value)).length,
          active: tab === t.value,
        }))}
      />

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-(--color-border) bg-(--color-surface)/60 px-6 py-14 text-center text-sm text-(--color-ink-muted)">
          No customers match this view.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ customer, name, paidOrders, totalSpent }) => {
            const isTop = topSpend > 0 && totalSpent === topSpend;
            return (
              <article
                key={customer.id}
                className="relative flex flex-col rounded-3xl border border-(--color-border)/70 bg-(--color-surface) p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                {isTop && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-(--color-warning-subtle) px-2.5 py-1 text-xs font-semibold text-(--color-warning)">
                    <Crown className="h-3.5 w-3.5" /> Top customer
                  </span>
                )}
                <div className="flex items-center gap-3 pr-24">
                  <InitialsAvatar name={name} className="h-12 w-12" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-(--color-ink)">{name}</p>
                    <p className="truncate text-xs text-(--color-ink-muted)">{customer.email ?? customer.phone ?? "No contact details"}</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-(--color-surface-subtle) px-4 py-3">
                    <p className="text-xs text-(--color-ink-muted)">Paid orders</p>
                    <p className="mt-1 text-xl font-semibold text-(--color-ink)">{paidOrders}</p>
                  </div>
                  <div className="rounded-2xl bg-(--color-surface-subtle) px-4 py-3">
                    <p className="text-xs text-(--color-ink-muted)">Total spent</p>
                    <p className="mt-1 truncate text-xl font-semibold text-(--color-ink)">
                      {formatCurrency(totalSpent, membership.store.currency)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {customer.phone && (
                    <a
                      href={whatsappHref(customer.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-sm font-medium text-white shadow-soft transition-transform hover:-translate-y-0.5"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-4 text-sm font-medium text-(--color-ink) shadow-soft transition-transform hover:-translate-y-0.5"
                    >
                      <Mail className="h-4 w-4" /> Email
                    </a>
                  )}
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-ink) shadow-soft transition-transform hover:-translate-y-0.5"
                      aria-label={`Call ${name}`}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
