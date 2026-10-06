import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStoreBySlug } from "@/lib/store-data";
import { DEFAULT_SELLER_REFUND_POLICY } from "@/lib/legal";

export const metadata: Metadata = { title: "Refunds and returns" };

export default async function StoreRefundsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const custom = store.refund_policy?.trim();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-(--color-ink)">Refunds and returns</h1>
      {custom ? (
        <div className="mt-6 whitespace-pre-line leading-relaxed text-(--color-ink)">{custom}</div>
      ) : (
        <ul className="mt-6 list-disc space-y-2 pl-5 leading-relaxed text-(--color-ink)">
          {DEFAULT_SELLER_REFUND_POLICY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <p className="mt-8 text-sm text-(--color-ink-muted)">
        To ask for a refund, contact {store.name} with your order number
        {store.contact_phone || store.contact_email ? ` at ${[store.contact_phone, store.contact_email].filter(Boolean).join(" or ")}` : ""}.
        Payments are refunded through Paystack to the original MoMo wallet or card. See also the{" "}
        <Link href="/refunds" className="underline underline-offset-4">
          HASTECH Commerce refund policy
        </Link>
        .
      </p>
    </div>
  );
}
