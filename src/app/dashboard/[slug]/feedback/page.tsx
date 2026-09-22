import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireStoreAccess, getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackForm } from "@/components/dashboard/feedback-form";
import type { PlatformFeedback } from "@/lib/types/database";
import { submitFeedbackAction } from "./actions";

export const metadata: Metadata = { title: "Feedback" };

const STATUS_TONE = { open: "warning", in_progress: "brand", resolved: "success" } as const;
const STATUS_LABEL = { open: "Open", in_progress: "In progress", resolved: "Resolved" } as const;
const CATEGORY_LABEL = {
  bug: "Bug",
  feature_request: "Feature request",
  question: "Question",
  other: "Other",
} as const;

export default async function FeedbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: submissions } = user
    ? ((await supabase
        .from("platform_feedback")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })) as unknown as { data: PlatformFeedback[] | null })
    : { data: null as PlatformFeedback[] | null };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-(--color-ink)">Feedback</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">
          Report a bug, ask for a feature, or flag anything else about the platform — this goes to the
          HASTECH team, not your customers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send feedback</CardTitle>
        </CardHeader>
        <CardBody>
          <FeedbackForm action={submitFeedbackAction.bind(null, slug)} />
        </CardBody>
      </Card>

      {submissions && submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your submissions</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {submissions.map((item) => (
              <div key={item.id} className="rounded-lg border border-(--color-border) p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-(--color-ink)">
                    {CATEGORY_LABEL[item.category]}
                  </span>
                  <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-(--color-ink-muted)">{item.message}</p>
                <p className="mt-1 text-xs text-(--color-ink-muted)">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
