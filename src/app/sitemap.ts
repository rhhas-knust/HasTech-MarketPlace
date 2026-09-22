import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/app-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = await getAppUrl();
  const admin = createAdminClient();

  // Matches the `stores_public_read` RLS policy exactly (status = 'active'
  // AND published_at is not null) -- listing a store here that isn't
  // actually publicly visible would hand Google a dead link.
  const { data: stores } = await admin
    .from("stores")
    .select("slug, updated_at")
    .eq("status", "active")
    .not("published_at", "is", null)
    .limit(1000);

  const storeEntries: MetadataRoute.Sitemap = (stores ?? []).map((store) => ({
    url: `${appUrl}/store/${store.slug}`,
    lastModified: store.updated_at,
  }));

  const { data: products } = await admin
    .from("products")
    .select("slug, updated_at, stores!inner(slug, status, published_at)")
    .eq("status", "published")
    .eq("stores.status", "active")
    .not("stores.published_at", "is", null)
    .limit(5000);

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((product) => ({
    url: `${appUrl}/store/${(product.stores as unknown as { slug: string }).slug}/product/${product.slug}`,
    lastModified: product.updated_at,
  }));

  return [
    { url: appUrl, lastModified: new Date() },
    { url: `${appUrl}/sell`, lastModified: new Date() },
    ...storeEntries,
    ...productEntries,
  ];
}
