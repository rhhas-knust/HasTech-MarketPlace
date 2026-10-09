import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { verifyAndProcessSponsorshipPayment } from "@/lib/sponsorships";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Promotion payment" };

export default async function PromoteCallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const { reference, trxref } = await searchParams;
  const paymentReference = reference ?? trxref;
  if (!paymentReference) notFound();

  let result: Awaited<ReturnType<typeof verifyAndProcessSponsorshipPayment>> | null;
  try {
    result = await verifyAndProcessSponsorshipPayment(membership.store.id, paymentReference);
  } catch {
    result = null;
  }
  const ok = result?.status === "success" || result?.status === "already_processed";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {ok ? (
        <>
          <svg aria-hidden viewBox="0 0 48 48" className="enter-scale mx-auto h-16 w-16">
            <circle cx="24" cy="24" r="24" className="fill-(--color-success-subtle)" />
            <path
              d="M15 24.5l6 6 12-13"
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={48}
              className="draw-check stroke-(--color-success)"
            />
          </svg>
          <h1 className="enter mt-4 text-2xl font-semibold text-(--color-ink)" style={{ "--i": 3 } as React.CSSProperties}>
            Your store is being promoted
          </h1>
          <p className="enter mt-2 text-(--color-ink-muted)" style={{ "--i": 4 } as React.CSSProperties}>
            {result?.endsAt
              ? `It now appears on other stores until ${new Date(result.endsAt).toLocaleDateString("en-GH", { day: "numeric", month: "long" })}.`
              : "It now appears on other stores."}
          </p>
        </>
      ) : (
        <>
          <XCircle className="mx-auto h-14 w-14 text-(--color-danger)" aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold text-(--color-ink)">We couldn&apos;t confirm your payment</h1>
          <p className="mt-2 text-(--color-ink-muted)">
            If you were charged, contact us with your reference:{" "}
            <code className="rounded bg-(--color-surface-subtle) px-1 py-0.5">{paymentReference}</code>.
          </p>
        </>
      )}
      <div className="mt-8">
        <LinkButton href={`/dashboard/${slug}/promote`} variant="outline">
          Back to Promote
        </LinkButton>
      </div>
    </div>
  );
}
