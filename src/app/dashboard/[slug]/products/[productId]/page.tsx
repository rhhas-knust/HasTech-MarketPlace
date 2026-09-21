import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreCategories } from "@/lib/store-data";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/dashboard/product-form";
import { ImageManager } from "@/components/dashboard/image-manager";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";
import type { ProductImage } from "@/lib/types/database";
import { updateProductAction, deleteProductAction } from "../actions";
import { uploadProductImage, deleteProductImage, setPrimaryProductImage } from "@/lib/product-images";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: product }, { data: images }, categories] = await Promise.all([
    supabase.from("products").select("*").eq("id", productId).eq("store_id", membership.store.id).maybeSingle(),
    supabase.from("product_images").select("*").eq("product_id", productId).order("sort_order"),
    getStoreCategories(membership.store.id),
  ]);

  if (!product) notFound();

  const boundUpdate = updateProductAction.bind(null, slug, productId);
  const boundDelete = deleteProductAction.bind(null, slug, productId);
  const boundUpload = uploadProductImage.bind(null, slug, productId);
  const boundDeleteImage = deleteProductImage.bind(null, slug);
  const boundSetPrimary = setPrimaryProductImage.bind(null, slug, productId);

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-(--color-ink)">Edit product</h1>
        <DeleteProductButton onDelete={boundDelete} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-(--color-ink)">Images</h2>
        <ImageManager
          images={(images ?? []) as ProductImage[]}
          onUpload={boundUpload}
          onDelete={boundDeleteImage}
          onSetPrimary={boundSetPrimary}
        />
      </section>

      <section className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
        <ProductForm action={boundUpdate} categories={categories} product={product} submitLabel="Save changes" />
      </section>
    </div>
  );
}
