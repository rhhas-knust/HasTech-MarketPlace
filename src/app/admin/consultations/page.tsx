import type { Metadata } from "next";
import { Building2, Mail, MessageCircle, Phone } from "lucide-react";
import { getConsultationRequests, updateConsultationStatus, type ConsultationRequestRow } from "@/lib/consultations";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "@/components/dashboard/status-select";
import { PageHeader, FilterTabs, InitialsAvatar, timeAgo } from "@/components/console/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Consultation requests" };

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

const TOPIC_LABELS: Record<string, string> = {
  how_it_works: "How it works",
  pricing: "Pricing & fees",
  other: "Something else",
};

type Filter = "all" | ConsultationRequestRow["status"];

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `233${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}

function currentTimeMs() {
  return Date.now();
}

export default async function AdminConsultationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter: Filter = status === "new" || status === "contacted" || status === "closed" ? status : "all";

  // getConsultationRequests() itself calls requirePlatformAdmin() and
  // redirects anyone who isn't one, so no separate check is needed here.
  const requests = await getConsultationRequests();
  const visible = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const count = (s: Filter) => (s === "all" ? requests.length : requests.filter((r) => r.status === s).length);
  const now = currentTimeMs();

  const tabs = (["all", "new", "contacted", "closed"] as Filter[]).map((value) => ({
    href: value === "all" ? "/admin/consultations" : `/admin/consultations?status=${value}`,
    label: value === "all" ? "All" : STATUS_OPTIONS.find((o) => o.value === value)!.label,
    count: count(value),
    active: filter === value,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Consultation requests"
        description="Messages from the public “Talk to us” form."
      />
      <FilterTabs tabs={tabs} />

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-(--color-border) bg-(--color-surface)/60 px-6 py-14 text-center text-sm text-(--color-ink-muted)">
          {requests.length === 0 ? "No requests yet. They'll appear here as soon as someone writes in." : "Nothing in this view."}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((request) => (
            <article
              key={request.id}
              className={cn(
                "flex flex-col rounded-3xl border bg-(--color-surface) p-6 shadow-soft transition-all duration-300 hover:shadow-lift",
                request.status === "new" ? "border-(--color-brand)/40" : "border-(--color-border)/70",
              )}
            >
              <div className="flex items-start gap-3">
                <InitialsAvatar name={request.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-(--color-ink)">{request.name}</p>
                    {request.status === "new" && (
                      <span className="rounded-full bg-(--color-danger) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        New
                      </span>
                    )}
                  </div>
                  {request.business_name && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-(--color-ink-muted)">
                      <Building2 className="h-3.5 w-3.5" /> {request.business_name}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-(--color-ink-muted)">{timeAgo(request.created_at, now)}</span>
              </div>

              <div className="mt-4">
                <Badge tone="brand">{TOPIC_LABELS[request.topic] ?? request.topic}</Badge>
              </div>
              <p className="mt-3 flex-1 whitespace-pre-line rounded-2xl rounded-tl-md bg-(--color-surface-subtle) px-4 py-3 text-sm leading-relaxed text-(--color-ink)">
                {request.message}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <a
                  href={`mailto:${request.email}?subject=${encodeURIComponent("Re: your HASTECH Commerce question")}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-gradient px-4 text-sm font-medium text-white shadow-glow transition-transform hover:-translate-y-0.5"
                >
                  <Mail className="h-4 w-4" /> Reply by email
                </a>
                {request.phone && (
                  <>
                    <a
                      href={whatsappHref(request.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-sm font-medium text-white shadow-soft transition-transform hover:-translate-y-0.5"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                    <a
                      href={`tel:${request.phone}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-4 text-sm font-medium text-(--color-ink) shadow-soft transition-transform hover:-translate-y-0.5"
                    >
                      <Phone className="h-4 w-4" /> Call
                    </a>
                  </>
                )}
                <div className="ml-auto">
                  <StatusSelect
                    value={request.status}
                    options={STATUS_OPTIONS}
                    onChange={async (value) => {
                      "use server";
                      await updateConsultationStatus(request.id, value as never);
                    }}
                  />
                </div>
              </div>
              <p className="mt-3 truncate text-xs text-(--color-ink-muted)">
                {request.email}
                {request.phone && <> · {request.phone}</>}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
