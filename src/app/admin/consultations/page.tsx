import type { Metadata } from "next";
import { getConsultationRequests, updateConsultationStatus } from "@/lib/consultations";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "@/components/dashboard/status-select";

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

export default async function AdminConsultationsPage() {
  // getConsultationRequests() itself calls requirePlatformAdmin() and
  // redirects anyone who isn't one, so no separate check is needed here.
  const requests = await getConsultationRequests();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-xl font-semibold text-(--color-ink)">Consultation requests</h1>
        <p className="text-sm text-(--color-ink-muted)">Messages from the public &quot;Talk to us&quot; form.</p>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-(--color-ink-muted)">No requests yet.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-(--color-ink)">
                      {request.name}
                      {request.business_name && (
                        <span className="text-(--color-ink-muted)"> &middot; {request.business_name}</span>
                      )}
                    </p>
                    <p className="text-sm text-(--color-ink-muted)">
                      <a href={`mailto:${request.email}`} className="hover:underline">
                        {request.email}
                      </a>
                      {request.phone && <> &middot; {request.phone}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{TOPIC_LABELS[request.topic] ?? request.topic}</Badge>
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
                <p className="mt-3 whitespace-pre-line text-sm text-(--color-ink)">{request.message}</p>
                <p className="mt-3 text-xs text-(--color-ink-muted)">
                  {new Date(request.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
