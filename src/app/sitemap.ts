import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const admin = createAdminClient();

  const { data: stores } = await admin
    .from("stores")
    .select("slug, updated_at")
    .eq("status", "active")
    .limit(1000);

  const storeEntries: MetadataRoute.Sitemap = (stores ?? []).map((store) => ({
    url: `${appUrl}/store/${store.slug}`,
    lastModified: store.updated_at,
  }));

  const { data: products } = await admin
    .from("products")
    .select("slug, updated_at, stores!inner(slug, status)")
    .eq("status", "published")
    .eq("stores.status", "active")
    .limit(5000);

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((product) => ({
    url: `${appUrl}/store/${(product.stores as unknown as { slug: string }).slug}/product/${product.slug}`,
    lastModified: product.updated_at,
  }));

  return [{ url: appUrl, lastModified: new Date() }, ...storeEntries, ...productEntries];
}
