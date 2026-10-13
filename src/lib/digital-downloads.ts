import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface DigitalDownload {
  orderItemId: string;
  productName: string;
  fileName: string;
  url: string;
}

const DOWNLOAD_LINK_TTL_SECONDS = 60 * 10;

/**
 * Signed, time-limited download links for every digital line item on a
 * paid order. Called from the checkout success page and order lookup --
 * never exposes the underlying storage path, and a fresh call always
 * re-signs a new link rather than the browser caching a stale one.
 *
 * Checks payment itself rather than trusting callers to: an order that
 * isn't "paid" in the database gets no links, whatever the caller thinks.
 */
export async function getDigitalDownloadsForOrder(orderId: string): Promise<DigitalDownload[]> {
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("payment_status").eq("id", orderId).maybeSingle();
  if (order?.payment_status !== "paid") return [];

  const { data: items } = await admin
    .from("order_items")
    .select("id, product_name, digital_file_path, digital_file_name")
    .eq("order_id", orderId)
    .not("digital_file_path", "is", null);

  if (!items || items.length === 0) return [];

  const downloads: DigitalDownload[] = [];
  for (const item of items) {
    if (!item.digital_file_path) continue;
    const { data } = await admin.storage
      .from("product-files")
      .createSignedUrl(item.digital_file_path, DOWNLOAD_LINK_TTL_SECONDS, {
        download: item.digital_file_name ?? true,
      });
    if (data?.signedUrl) {
      downloads.push({
        orderItemId: item.id,
        productName: item.product_name,
        fileName: item.digital_file_name ?? "download",
        url: data.signedUrl,
      });
    }
  }
  return downloads;
}
