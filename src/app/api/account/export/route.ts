import { NextResponse } from "next/server";
import { getCurrentProfile, requireStoreAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * "Download my data" (right of access, Act 843). Runs as the signed-in user,
 * so row level security limits it to what they can already see.
 */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("store") ?? "";
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const membership = await requireStoreAccess(slug);
  if (!membership) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const supabase = await createClient();
  const storeId = membership.store.id;
  const [products, categories, customers, orders] = await Promise.all([
    supabase.from("products").select("name, slug, description, price, sale_price, currency, stock_quantity, status, created_at").eq("store_id", storeId),
    supabase.from("categories").select("name, slug, created_at").eq("store_id", storeId),
    supabase.from("customers").select("first_name, last_name, email, phone, created_at").eq("store_id", storeId),
    supabase
      .from("orders")
      .select("id, order_number, subtotal, delivery_fee, discount, total, currency, payment_status, fulfilment_status, delivery_method, created_at")
      .eq("store_id", storeId),
  ]);
  const orderIds = (orders.data ?? []).map((o) => o.id);
  const orderItems =
    orderIds.length > 0
      ? await supabase.from("order_items").select("order_id, product_name, unit_price, quantity, line_total").in("order_id", orderIds)
      : { data: [] };

  const body = {
    exported_at: new Date().toISOString(),
    account: { name: profile.full_name, email: profile.email, phone: profile.phone, created_at: profile.created_at },
    store: {
      name: membership.store.name,
      slug: membership.store.slug,
      description: membership.store.description,
      contact_email: membership.store.contact_email,
      contact_phone: membership.store.contact_phone,
      address: membership.store.address,
      city: membership.store.city,
      region: membership.store.region,
      refund_policy: membership.store.refund_policy,
      created_at: membership.store.created_at,
      your_role: membership.role,
    },
    categories: categories.data ?? [],
    products: products.data ?? [],
    customers: customers.data ?? [],
    orders: orders.data ?? [],
    order_items: orderItems.data ?? [],
  };

  const filename = `hastech-${membership.store.slug}-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
