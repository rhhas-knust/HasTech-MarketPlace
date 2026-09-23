import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/money";
import { FULFILMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusSelect } from "@/components/dashboard/status-select";
import { updateFulfilmentStatusAction, updatePaymentStatusAction } from "../actions";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, customers(*), order_items(*), customer_addresses:delivery_address_id(*)")
    .eq("id", orderId)
    .eq("store_id", membership.store.id)
    .maybeSingle();

  if (!order) notFound();

  const customer = order.customers as unknown as {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  const address = order.customer_addresses as unknown as {
    address_line: string;
    city: string | null;
    region: string | null;
  } | null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-(--color-ink)">Order {order.order_number}</h1>
        <p className="text-sm text-(--color-ink-muted)">
          Placed {new Date(order.created_at).toLocaleString("en-GB")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fulfilment status</CardTitle>
          </CardHeader>
          <CardBody>
            <StatusSelect
              value={order.fulfilment_status}
              options={Object.entries(FULFILMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              onChange={async (value) => {
                "use server";
                await updateFulfilmentStatusAction(slug, orderId, value as never);
              }}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment status</CardTitle>
          </CardHeader>
          <CardBody>
            <StatusSelect
              value={order.payment_status}
              options={Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              onChange={async (value) => {
                "use server";
                await updatePaymentStatusAction(slug, orderId, value as never);
              }}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-(--color-border)">
            {(
              order.order_items as {
                id: string;
                product_name: string;
                quantity: number;
                unit_price: number;
                line_total: number;
                is_preorder: boolean;
              }[]
            ).map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <span className="flex items-center gap-2 text-(--color-ink)">
                  {item.product_name} × {item.quantity}
                  {item.is_preorder && <Badge tone="brand">Pre-order</Badge>}
                </span>
                <span className="text-(--color-ink-muted)">{formatCurrency(item.line_total, order.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-(--color-border) pt-3 text-sm">
            <div className="flex justify-between text-(--color-ink-muted)">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between text-(--color-ink-muted)">
              <span>Delivery</span>
              <span>{formatCurrency(order.delivery_fee, order.currency)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-(--color-ink-muted)">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-(--color-ink)">
              <span>Total</span>
              <span>{formatCurrency(order.total, order.currency)}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardBody className="space-y-1 text-sm text-(--color-ink)">
          <p>{[customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || "—"}</p>
          <p className="text-(--color-ink-muted)">{customer?.email}</p>
          <p className="text-(--color-ink-muted)">{customer?.phone}</p>
          {order.delivery_method === "delivery" && address && (
            <p className="pt-2 text-(--color-ink-muted)">
              {address.address_line}
              {address.city ? `, ${address.city}` : ""}
              {address.region ? `, ${address.region}` : ""}
            </p>
          )}
          {order.delivery_method === "pickup" && <p className="pt-2 text-(--color-ink-muted)">Customer will pick up</p>}
          {order.notes && <p className="pt-2 italic text-(--color-ink-muted)">&ldquo;{order.notes}&rdquo;</p>}
        </CardBody>
      </Card>
    </div>
  );
}
