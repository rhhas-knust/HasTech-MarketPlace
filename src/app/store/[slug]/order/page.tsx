import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getStoreBySlug } from "@/lib/store-data";
import { OrderLookupForm } from "@/components/storefront/order-lookup-form";
import { lookupOrderAction } from "./actions";

export const metadata: Metadata = { title: "Track your order" };

export default async function OrderLookupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const boundAction = lookupOrderAction.bind(null, store.slug);

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="mb-1 text-xl font-semibold text-(--color-ink)">Track your order</h1>
      <p className="mb-6 text-sm text-(--color-ink-muted)">
        Enter your order number and the email you used at checkout.
      </p>
      <Suspense>
        <OrderLookupForm action={boundAction} />
      </Suspense>
    </div>
  );
}
