import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductStatus } from "@/lib/types/database";

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

export interface OverviewStats {
  totalRevenue: number;
  paidOrdersCount: number;
  totalOrdersCount: number;
  productsCount: number;
  customersCount: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  totalViews: number;
  addToCartCount: number;
  purchaseCount: number;
}

/** Every number here is a live aggregate query -- nothing is hard-coded. */
export async function getOverviewStats(storeId: string): Promise<OverviewStats> {
  const supabase = await createClient();

  const [
    revenueRes,
    ordersRes,
    productsRes,
    customersRes,
    viewsTodayRes,
    viewsWeekRes,
    viewsMonthRes,
    totalViewsRes,
    addToCartRes,
    purchaseRes,
  ] = await Promise.all([
    supabase.from("orders").select("total", { count: "exact" }).eq("store_id", storeId).eq("payment_status", "paid"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", storeId),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", storeId).neq("status", "archived"),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("store_id", storeId),
    supabase
      .from("product_views")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .gte("created_at", daysAgo(1)),
    supabase
      .from("product_views")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .gte("created_at", daysAgo(7)),
    supabase
      .from("product_views")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .gte("created_at", daysAgo(30)),
    supabase.from("product_views").select("id", { count: "exact", head: true }).eq("store_id", storeId),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("event_type", "add_to_cart"),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("event_type", "purchase"),
  ]);

  const totalRevenue = (revenueRes.data ?? []).reduce((sum, row) => sum + Number(row.total), 0);

  return {
    totalRevenue,
    paidOrdersCount: revenueRes.count ?? 0,
    totalOrdersCount: ordersRes.count ?? 0,
    productsCount: productsRes.count ?? 0,
    customersCount: customersRes.count ?? 0,
    viewsToday: viewsTodayRes.count ?? 0,
    viewsThisWeek: viewsWeekRes.count ?? 0,
    viewsThisMonth: viewsMonthRes.count ?? 0,
    totalViews: totalViewsRes.count ?? 0,
    addToCartCount: addToCartRes.count ?? 0,
    purchaseCount: purchaseRes.count ?? 0,
  };
}

export interface DailyPoint {
  date: string;
  value: number;
}

export async function getRevenueOverTime(storeId: string, days = 30): Promise<DailyPoint[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("total, created_at")
    .eq("store_id", storeId)
    .eq("payment_status", "paid")
    .gte("created_at", daysAgo(days));

  const byDay = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    byDay.set(daysAgo(i).slice(0, 10), 0);
  }
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + Number(row.total));
  }
  return Array.from(byDay.entries()).map(([date, value]) => ({ date, value }));
}

export async function getViewsOverTime(storeId: string, days = 30): Promise<DailyPoint[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_views")
    .select("created_at")
    .eq("store_id", storeId)
    .gte("created_at", daysAgo(days));

  const byDay = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    byDay.set(daysAgo(i).slice(0, 10), 0);
  }
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  return Array.from(byDay.entries()).map(([date, value]) => ({ date, value }));
}

export interface TopProduct {
  id: string;
  name: string;
  slug: string;
  viewCount: number;
  addToCartCount: number;
  purchaseCount: number;
}

export async function getTopViewedProducts(storeId: string, limit = 5): Promise<TopProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, slug, view_count, add_to_cart_count, purchase_count")
    .eq("store_id", storeId)
    .order("view_count", { ascending: false })
    .limit(limit);

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    viewCount: p.view_count,
    addToCartCount: p.add_to_cart_count,
    purchaseCount: p.purchase_count,
  }));
}

export interface ActivityItem {
  id: string;
  type: string;
  createdAt: string;
  description: string;
}

export async function getRecentActivity(storeId: string, limit = 20): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("analytics_events")
    .select("id, event_type, created_at, products(name), orders(order_number)")
    .eq("store_id", storeId)
    .in("event_type", ["product_view", "add_to_cart", "purchase"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const product = row.products as unknown as { name: string } | null;
    const order = row.orders as unknown as { order_number: string } | null;
    let description = "Activity recorded";
    if (row.event_type === "product_view" && product) description = `Someone viewed "${product.name}"`;
    if (row.event_type === "add_to_cart" && product) description = `"${product.name}" was added to a cart`;
    if (row.event_type === "purchase") {
      description = order ? `Order ${order.order_number} was paid` : "A new order was paid";
    }
    return { id: row.id, type: row.event_type, createdAt: row.created_at, description };
  });
}

export async function getStoreOrders(storeId: string, options: { fulfilmentStatus?: string } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*, customers(first_name, last_name, email)")
    .eq("store_id", storeId);
  if (options.fulfilmentStatus) query = query.eq("fulfilment_status", options.fulfilmentStatus);
  const { data } = await query.order("created_at", { ascending: false }).limit(200);
  return data ?? [];
}

export async function getStoreCustomers(storeId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("*, orders(id, total, payment_status)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function getStoreProducts(
  storeId: string,
  options: { status?: ProductStatus; search?: string } = {},
): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select("*").eq("store_id", storeId);
  if (options.status) query = query.eq("status", options.status);
  if (options.search) query = query.ilike("name", `%${options.search}%`);
  const { data } = await query.order("created_at", { ascending: false });
  return data ?? [];
}
