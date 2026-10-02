import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types/database";
import { isLowStock, isOutOfStock } from "@/lib/inventory";

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

export type DashboardProduct = Product & { product_images: { url: string; is_primary: boolean; sort_order: number }[] };

/** All of a store's products (filtering by status/stock happens in the page so tab counts stay accurate). */
export async function getStoreProducts(storeId: string, options: { search?: string } = {}) {
  const supabase = await createClient();
  let query = supabase.from("products").select("*, product_images(url, is_primary, sort_order)").eq("store_id", storeId);
  if (options.search) query = query.ilike("name", `%${options.search}%`);
  const [{ data }, lowStockThreshold] = await Promise.all([
    query.order("created_at", { ascending: false }),
    getStoreLowStockThreshold(storeId),
  ]);
  return { products: (data as DashboardProduct[]) ?? [], lowStockThreshold };
}

// Fulfilment states that still need the seller to do something.
export const OPEN_FULFILMENT_STATUSES = ["pending", "confirmed", "processing"] as const;

async function getStoreLowStockThreshold(storeId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("store_settings").select("low_stock_threshold").eq("store_id", storeId).maybeSingle();
  return data?.low_stock_threshold ?? 5;
}

export interface AttentionCounts {
  ordersToFulfil: number;
  lowStock: number;
  outOfStock: number;
}

/** Paid orders still waiting to be fulfilled, and products running low or out. */
export async function getAttentionCounts(storeId: string): Promise<AttentionCounts> {
  const supabase = await createClient();
  const [{ count: ordersToFulfil }, { data: stocked }, threshold] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("payment_status", "paid")
      .in("fulfilment_status", [...OPEN_FULFILMENT_STATUSES]),
    supabase
      .from("products")
      .select("track_inventory, stock_quantity, low_stock_threshold, is_preorder")
      .eq("store_id", storeId)
      .neq("status", "archived")
      .eq("track_inventory", true),
    getStoreLowStockThreshold(storeId),
  ]);

  const products = stocked ?? [];
  return {
    ordersToFulfil: ordersToFulfil ?? 0,
    lowStock: products.filter((p) => isLowStock(p, threshold)).length,
    outOfStock: products.filter((p) => isOutOfStock(p)).length,
  };
}

export interface WeeklyHighlights {
  ordersThisWeek: number;
  revenueThisWeek: number;
  customersThisWeek: number;
}

export async function getWeeklyHighlights(storeId: string): Promise<WeeklyHighlights> {
  const supabase = await createClient();
  const weekAgo = daysAgo(7);
  const [{ data: paid }, { count: ordersThisWeek }, { count: customersThisWeek }] = await Promise.all([
    supabase
      .from("orders")
      .select("total")
      .eq("store_id", storeId)
      .eq("payment_status", "paid")
      .gte("created_at", weekAgo),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", storeId).gte("created_at", weekAgo),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("store_id", storeId).gte("created_at", weekAgo),
  ]);
  return {
    ordersThisWeek: ordersThisWeek ?? 0,
    revenueThisWeek: (paid ?? []).reduce((sum, o) => sum + Number(o.total), 0),
    customersThisWeek: customersThisWeek ?? 0,
  };
}

export async function getTopSellingProducts(storeId: string, limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, price, currency, purchase_count, view_count")
    .eq("store_id", storeId)
    .neq("status", "archived")
    .order("purchase_count", { ascending: false })
    .order("view_count", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getRecentOrders(storeId: string, limit = 6) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, total, currency, payment_status, fulfilment_status, created_at, customers(first_name, last_name, email)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
