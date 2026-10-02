import type { Metadata } from "next";
import { Bug, CircleHelp, Lightbulb, Mail, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusSelect } from "@/components/dashboard/status-select";
import { PageHeader, FilterTabs, InitialsAvatar, timeAgo } from "@/components/console/ui";
import { cn } from "@/lib/cn";
import { updateFeedbackStatus } from "./actions";

export const metadata: Metadata = { title: "Platform feedback" };

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

const CATEGORIES: Record<string, { label: string; icon: typeof Bug; tone: string }> = {
  bug: { label: "Bug", icon: Bug, tone: "bg-(--color-danger-subtle) text-(--color-danger)" },
  feature_request: { label: "Feature request", icon: Lightbulb, tone: "bg-(--color-warning-subtle) text-(--color-warning)" },
  question: { label: "Question", icon: CircleHelp, tone: "bg-(--color-brand-subtle) text-(--color-brand)" },
  other: { label: "Other", icon: MessageSquare, tone: "bg-(--color-surface-subtle) text-(--color-ink-muted)" },
};

type Filter = "all" | "open" | "in_progress" | "resolved";

function currentTimeMs() {
  return Date.now();
}

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter: Filter = status === "open" || status === "in_progress" || status === "resolved" ? status : "all";

  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_feedback")
    .select("id, category, message, status, created_at, profiles(full_name, email), stores(name, slug)")
    .order("created_at", { ascending: false });

  const feedback = data ?? [];
  const visible = filter === "all" ? feedback : feedback.filter((f) => f.status === filter);
  const now = currentTimeMs();

  const tabs = (["all", "open", "in_progress", "resolved"] as Filter[]).map((value) => ({
    href: value === "all" ? "/admin/feedback" : `/admin/feedback?status=${value}`,
    label: value === "all" ? "All" : STATUS_OPTIONS.find((o) => o.value === value)!.label,
    count: value === "all" ? feedback.length : feedback.filter((f) => f.status === value).length,
    active: filter === value,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Platform feedback"
        description="Bug reports and feature requests sellers have sent in."
      />
      <FilterTabs tabs={tabs} />

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-(--color-border) bg-(--color-surface)/60 px-6 py-14 text-center text-sm text-(--color-ink-muted)">
          {feedback.length === 0 ? "No feedback yet. Sellers can send it from their dashboard." : "Nothing in this view."}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((item) => {
            const author = item.profiles as unknown as { full_name: string | null; email: string } | null;
            const store = item.stores as unknown as { name: string; slug: string } | null;
            const category = CATEGORIES[item.category] ?? CATEGORIES.other;
            const Icon = category.icon;
            return (
              <article
                key={item.id}
                className={cn(
                  "flex flex-col rounded-3xl border bg-(--color-surface) p-6 shadow-soft transition-all duration-300 hover:shadow-lift",
                  item.status === "open" ? "border-(--color-brand)/40" : "border-(--color-border)/70",
                  item.status === "resolved" && "opacity-75",
                )}
              >
                <div className="flex items-start gap-3">
                  <InitialsAvatar name={author?.full_name ?? author?.email ?? "?"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-(--color-ink)">{author?.full_name ?? author?.email ?? "Unknown"}</p>
                    {store && <p className="truncate text-sm text-(--color-ink-muted)">{store.name}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-(--color-ink-muted)">{timeAgo(item.created_at, now)}</span>
                </div>

                <span className={cn("mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", category.tone)}>
                  <Icon className="h-3.5 w-3.5" /> {category.label}
                </span>
                <p className="mt-3 flex-1 whitespace-pre-line rounded-2xl rounded-tl-md bg-(--color-surface-subtle) px-4 py-3 text-sm leading-relaxed text-(--color-ink)">
                  {item.message}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {author?.email && (
                    <a
                      href={`mailto:${author.email}?subject=${encodeURIComponent("Re: your HASTECH Commerce feedback")}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-4 text-sm font-medium text-(--color-ink) shadow-soft transition-transform hover:-translate-y-0.5"
                    >
                      <Mail className="h-4 w-4" /> Reply
                    </a>
                  )}
                  <div className="ml-auto">
                    <StatusSelect
                      value={item.status}
                      options={STATUS_OPTIONS}
                      onChange={async (value) => {
                        "use server";
                        await updateFeedbackStatus(item.id, value as never);
                      }}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
