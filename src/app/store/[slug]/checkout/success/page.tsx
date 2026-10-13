import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { XCircle, Download } from "lucide-react";
import { getStoreBySlug } from "@/lib/store-data";
import { verifyAndProcessPayment } from "@/lib/payments/process";
import { getDigitalDownloadsForOrder } from "@/lib/digital-downloads";
import { Button, LinkButton } from "@/components/ui/button";
import { PaymentPending } from "@/components/payment-pending";
import { retryPaymentAction } from "../actions";
import { SponsoredCategoryStrip } from "@/components/storefront/sponsored-stores";

export const metadata: Metadata = { title: "Order confirmation" };

const RETRY_MESSAGES: Record<string, string> = {
  stock: "Sorry, an item in this order has sold out since you ordered it, so it can't be paid for now.",
  limited: "Too many attempts. Please wait a few minutes and try again.",
  unavailable: "This order can't be paid online right now. Please contact the store.",
};

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reference?: string; trxref?: string; retry?: string }>;
}) {
  const { slug } = await params;
  const { reference, trxref, retry } = await searchParams;
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

  // Only these two statuses mean the order is "paid" in the database;
  // reaching this page proves nothing on its own.
  const isPaid = result?.status === "paid" || result?.status === "already_paid";
  const isPending = result?.status === "pending";
  const downloads = isPaid && result ? await getDigitalDownloadsForOrder(result.orderId) : [];

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {isPaid ? (
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
            Payment successful
          </h1>
          <p className="enter mt-2 text-(--color-ink-muted)" style={{ "--i": 4 } as React.CSSProperties}>
            Thank you! Your order {result?.orderNumber ? <strong>{result.orderNumber}</strong> : ""} has
            been confirmed. A confirmation has been recorded with {store.name}.
          </p>
        </>
      ) : isPending ? (
        <PaymentPending />
      ) : (
        <>
          <XCircle className="enter-scale mx-auto h-14 w-14 text-(--color-danger)" aria-hidden />
          <h1 className="mt-4 text-2xl font-semibold text-(--color-ink)">Payment not completed</h1>
          <p className="mt-2 text-(--color-ink-muted)">
            {result
              ? "This payment didn't go through, so your order hasn't been paid. You can try again below."
              : "We couldn't check this payment right now. Please try again in a moment."}{" "}
            If you were charged, contact {store.name} with your reference:{" "}
            <code className="rounded bg-(--color-surface-subtle) px-1 py-0.5">{paymentReference}</code>.
          </p>
          {retry && (
            <p role="alert" className="mt-4 rounded-md bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
              {RETRY_MESSAGES[retry] ?? RETRY_MESSAGES.unavailable}
            </p>
          )}
          {result?.status === "failed" && (
            <form action={retryPaymentAction.bind(null, store.slug, paymentReference)} className="mt-6">
              <Button type="submit" variant="store">
                Try paying again
              </Button>
            </form>
          )}
        </>
      )}

      {downloads.length > 0 && (
        <div
          className="enter mt-6 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-left"
          style={{ "--i": 5 } as React.CSSProperties}
        >
          <p className="mb-3 text-sm font-medium text-(--color-ink)">Your downloads</p>
          <ul className="space-y-2">
            {downloads.map((download) => (
              <li key={download.orderItemId}>
                <a
                  href={download.url}
                  className="flex items-center gap-2 text-sm text-(--color-brand) hover:underline"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  {download.productName}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-(--color-ink-muted)">
            These links expire after a few minutes. Look up your order any time to get new ones.
          </p>
        </div>
      )}

      <div className="enter mt-8 flex justify-center gap-3" style={{ "--i": 6 } as React.CSSProperties}>
        <LinkButton href={`/store/${store.slug}`} variant="outline">
          Back to store
        </LinkButton>
        {result?.orderNumber && (
          <LinkButton href={`/store/${store.slug}/order?number=${result.orderNumber}`} variant="store">
            Track order
          </LinkButton>
        )}
      </div>

      {isPaid && store.show_sponsored !== false && (
        <SponsoredCategoryStrip hostStoreId={store.id} hostBusinessType={store.business_type} />
      )}
    </div>
  );
}
