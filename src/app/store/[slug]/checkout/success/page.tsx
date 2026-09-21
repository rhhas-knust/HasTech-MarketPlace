import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { getStoreBySlug } from "@/lib/store-data";
import { verifyAndProcessPayment } from "@/lib/payments/process";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Order confirmation" };

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { slug } = await params;
  const { reference, trxref } = await searchParams;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const paymentReference = reference ?? trxref;
  if (!paymentReference) notFound();

  let result;
  try {
    result = await verifyAndProcessPayment(store.id, paymentReference);
  } catch {
    result = null;
  }

  const isPaid = result?.status === "paid" || result?.status === "already_processed";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {isPaid ? (
        <>
          <CheckCircle2 className="mx-auto h-14 w-14 text-(--color-success)" />
          <h1 className="mt-4 text-2xl font-semibold text-(--color-ink)">Payment successful</h1>
          <p className="mt-2 text-(--color-ink-muted)">
            Thank you! Your order {result?.orderNumber ? <strong>{result.orderNumber}</strong> : ""} has
            been confirmed. A confirmation has been recorded with {store.name}.
          </p>
        </>
      ) : (
        <>
          <XCircle className="mx-auto h-14 w-14 text-(--color-danger)" />
          <h1 className="mt-4 text-2xl font-semibold text-(--color-ink)">We couldn&apos;t confirm your payment</h1>
          <p className="mt-2 text-(--color-ink-muted)">
            Your payment could not be verified. If you were charged, please contact {store.name} with your
            reference: <code className="rounded bg-(--color-surface-subtle) px-1 py-0.5">{paymentReference}</code>.
          </p>
        </>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <LinkButton href={`/store/${store.slug}`} variant="outline">
          Back to store
        </LinkButton>
        {result?.orderNumber && (
          <LinkButton href={`/store/${store.slug}/order?number=${result.orderNumber}`} variant="store">
            Track order
          </LinkButton>
        )}
      </div>
    </div>
  );
}
