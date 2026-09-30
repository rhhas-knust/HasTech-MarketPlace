import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "@/components/dashboard/status-select";
import { updateFeedbackStatus } from "./actions";

export const metadata: Metadata = { title: "Platform feedback" };

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug",
  feature_request: "Feature request",
  question: "Question",
  other: "Other",
};

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const { data: feedback } = await supabase
    .from("platform_feedback")
    .select("id, category, message, status, created_at, profiles(full_name, email), stores(name, slug)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-(--color-ink)">Platform feedback</h1>
        <p className="text-sm text-(--color-ink-muted)">Bug reports and feature requests sellers have sent in.</p>
      </div>

      {(feedback ?? []).length === 0 ? (
        <p className="text-sm text-(--color-ink-muted)">No feedback yet.</p>
      ) : (
        <div className="space-y-4">
          {(feedback ?? []).map((item) => {
            const author = item.profiles as unknown as { full_name: string | null; email: string } | null;
            const store = item.stores as unknown as { name: string; slug: string } | null;
            return (
              <Card key={item.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-(--color-ink)">
                        {author?.full_name ?? author?.email ?? "Unknown"}
                        {store && <span className="text-(--color-ink-muted)"> &middot; {store.name}</span>}
                      </p>
                      <p className="text-xs text-(--color-ink-muted)">
                        {new Date(item.created_at).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{CATEGORY_LABELS[item.category] ?? item.category}</Badge>
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
                  <p className="mt-3 whitespace-pre-line text-sm text-(--color-ink)">{item.message}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
