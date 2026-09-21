import "server-only";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { VISITOR_ID_COOKIE } from "@/lib/constants";
import type { AnalyticsEventType } from "@/lib/types/database";

async function getVisitorId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(VISITOR_ID_COOKIE)?.value ?? null;
}

function guessDeviceType(userAgent: string | null): string {
  if (!userAgent) return "unknown";
  if (/mobile/i.test(userAgent)) return "mobile";
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  return "desktop";
}

/**
 * Records a (deduplicated) product view. Safe to call from a public product
 * page server component -- it goes through the record_product_view RPC,
 * which anon is explicitly granted execute on (see
 * 0009_functions_triggers.sql), rather than inserting into product_views
 * directly (which RLS blocks for every client role).
 */
export async function trackProductView(storeId: string, productId: string) {
  const visitorId = await getVisitorId();
  if (!visitorId) return;

  const headerList = await headers();
  const supabase = await createClient();

  await supabase.rpc("record_product_view", {
    p_store_id: storeId,
    p_product_id: productId,
    p_visitor_id: visitorId,
    p_session_id: visitorId,
    p_source: headerList.get("referer"),
    p_device_type: guessDeviceType(headerList.get("user-agent")),
    p_country: headerList.get("x-vercel-ip-country"),
  });
}

export async function trackEvent(
  storeId: string,
  eventType: AnalyticsEventType,
  options: { productId?: string; orderId?: string; metadata?: Record<string, unknown> } = {},
) {
  const visitorId = await getVisitorId();
  const headerList = await headers();
  const supabase = await createClient();

  await supabase.rpc("record_analytics_event", {
    p_store_id: storeId,
    p_event_type: eventType,
    p_product_id: options.productId ?? null,
    p_order_id: options.orderId ?? null,
    p_session_id: visitorId,
    p_visitor_id: visitorId,
    p_metadata: options.metadata ?? {},
    p_source: headerList.get("referer"),
    p_device_type: guessDeviceType(headerList.get("user-agent")),
    p_country: headerList.get("x-vercel-ip-country"),
  });
}
