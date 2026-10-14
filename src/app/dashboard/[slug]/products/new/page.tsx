import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreCategories } from "@/lib/store-data";
import { ProductForm } from "@/components/dashboard/product-form";
import { createProductAction } from "../actions";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const categories = await getStoreCategories(membership.store.id);
  const boundAction = createProductAction.bind(null, slug);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link
          href={`/dashboard/${slug}/products`}
          className="inline-flex items-center gap-1 text-sm text-(--color-ink-muted) hover:text-(--color-ink)"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-(--color-ink)">Add a product</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">
          Save the details first. You&apos;ll add photos and any download file on the next screen.
        </p>
      </div>
      <ProductForm action={boundAction} categories={categories} submitLabel="Save and add photos" />
    </div>
  );
}
