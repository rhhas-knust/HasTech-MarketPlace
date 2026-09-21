import { redirect } from "next/navigation";
import type { Metadata } from "next";
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
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-(--color-ink)">New product</h1>
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <ProductForm action={boundAction} categories={categories} submitLabel="Create product" />
      </div>
    </div>
  );
}
