import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreCategories } from "@/lib/store-data";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryForm } from "@/components/dashboard/category-form";
import { DeleteIconButton } from "@/components/dashboard/delete-icon-button";
import { createCategoryAction, deleteCategoryAction } from "./actions";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const categories = await getStoreCategories(membership.store.id);
  const boundCreate = createCategoryAction.bind(null, slug);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-(--color-ink)">Categories</h1>

      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
        <CategoryForm action={boundCreate} />
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={<Tag className="h-8 w-8" />} title="No categories yet" description="Organise your products into categories customers can browse." />
      ) : (
        <ul className="divide-y divide-(--color-border) rounded-xl border border-(--color-border) bg-(--color-surface)">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-(--color-ink)">{category.name}</p>
                {category.description && <p className="text-sm text-(--color-ink-muted)">{category.description}</p>}
              </div>
              <DeleteIconButton onDelete={deleteCategoryAction.bind(null, slug, category.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
