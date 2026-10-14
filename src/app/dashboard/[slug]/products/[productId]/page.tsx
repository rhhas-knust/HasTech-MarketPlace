import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreCategories } from "@/lib/store-data";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/dashboard/product-form";
import { ImageManager } from "@/components/dashboard/image-manager";
import { DigitalFileManager } from "@/components/dashboard/digital-file-manager";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";
import { Badge } from "@/components/ui/badge";
import type { ProductImage } from "@/lib/types/database";
import { updateProductAction, deleteProductAction } from "../actions";
import { uploadProductImage, deleteProductImage, setPrimaryProductImage } from "@/lib/product-images";
import { uploadDigitalFile, removeDigitalFile } from "@/lib/product-files";

export const metadata: Metadata = { title: "Edit product" };

const STATUS_BADGE = {
  published: { label: "Published", tone: "success" },
  draft: { label: "Draft", tone: "neutral" },
  archived: { label: "Archived", tone: "warning" },
} as const;

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

  const storeLive = Boolean(membership.store.published_at) && membership.store.status === "active";
  const status = STATUS_BADGE[product.status as keyof typeof STATUS_BADGE];

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link
          href={`/dashboard/${slug}/products`}
          className="inline-flex items-center gap-1 text-sm text-(--color-ink-muted) hover:text-(--color-ink)"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Products
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold tracking-tight text-(--color-ink)">{product.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              {product.status === "published" && !storeLive && (
                <span className="text-xs text-(--color-ink-muted)">Customers will see it once your store is published.</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {storeLive && product.status === "published" && (
              <a
                href={`/store/${membership.store.slug}/product/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--color-border-strong)/60 px-3 text-sm font-medium text-(--color-ink) hover:bg-(--color-surface-subtle)"
              >
                <ExternalLink className="h-4 w-4" aria-hidden /> View on store
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
            <DeleteProductButton name={product.name} onDelete={deleteProductAction.bind(null, slug, productId)}>
              <Trash2 className="h-4 w-4" aria-hidden /> Delete
            </DeleteProductButton>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 sm:p-5">
        <h2 className="text-base font-semibold text-(--color-ink)">Photos</h2>
        <p className="mt-0.5 text-sm text-(--color-ink-muted)">
          The starred photo is the one customers see first. Clear, well-lit photos sell better.
        </p>
        <div className="mt-4">
          <ImageManager
            images={(images ?? []) as ProductImage[]}
            onUpload={uploadProductImage.bind(null, slug, productId)}
            onDelete={deleteProductImage.bind(null, slug)}
            onSetPrimary={setPrimaryProductImage.bind(null, slug, productId)}
          />
        </div>
      </section>

      <section className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 sm:p-5">
        <h2 className="text-base font-semibold text-(--color-ink)">Download file (optional)</h2>
        <p className="mt-0.5 mb-4 text-sm text-(--color-ink-muted)">
          For digital products: customers get a download link once their payment is confirmed.
        </p>
        <DigitalFileManager
          fileName={product.digital_file_name}
          fileSize={product.digital_file_size}
          onUpload={uploadDigitalFile.bind(null, slug, productId)}
          onRemove={removeDigitalFile.bind(null, slug, productId)}
        />
      </section>

      <ProductForm action={updateProductAction.bind(null, slug, productId)} categories={categories} product={product} submitLabel="Save changes" />
    </div>
  );
}
