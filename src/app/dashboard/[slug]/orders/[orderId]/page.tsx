import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Mail, MapPin, MessageCircle, Phone, Store, Truck } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/money";
import { whatsappLink } from "@/lib/whatsapp";
import { FULFILMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusSelect } from "@/components/dashboard/status-select";
import type { FulfilmentStatus } from "@/lib/types/database";
import { updateFulfilmentStatusAction, updatePaymentStatusAction } from "../actions";

export const metadata: Metadata = { title: "Order details" };

/** The one obvious next step for a paid order, following the fulfilment flow. */
const NEXT_STEP: Partial<Record<FulfilmentStatus, { to: FulfilmentStatus; label: string; hint: string }>> = {
  pending: { to: "confirmed", label: "Confirm order", hint: "Let the order in and start preparing it." },
  confirmed: { to: "processing", label: "Start preparing", hint: "Mark it as being packed or prepared." },
  processing: { to: "ready", label: "Mark as ready", hint: "It's packed and ready for delivery or pickup." },
  ready: { to: "completed", label: "Mark as completed", hint: "The customer has received it." },
};

const CLOSED: FulfilmentStatus[] = ["cancelled", "refunded"];

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
  const items = order.order_items as {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    is_preorder: boolean;
  }[];

  const paid = order.payment_status === "paid";
  const closed = CLOSED.includes(order.fulfilment_status);
  const next = paid && !closed ? NEXT_STEP[order.fulfilment_status as FulfilmentStatus] : undefined;
  const customerName = [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || "Customer";

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link
          href={`/dashboard/${slug}/orders`}
          className="inline-flex items-center gap-1 text-sm text-(--color-ink-muted) hover:text-(--color-ink)"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Orders
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-(--color-ink)">
              Order <span className="tabular-nums">{order.order_number}</span>
            </h1>
            <p className="mt-0.5 text-sm text-(--color-ink-muted)">
              Placed{" "}
              {new Date(order.created_at).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={paid ? "success" : order.payment_status === "failed" ? "danger" : "warning"}>
              {paid ? "Paid" : order.payment_status === "failed" ? "Payment failed" : PAYMENT_STATUS_LABELS[order.payment_status]}
            </Badge>
            <Badge tone={closed ? "neutral" : order.fulfilment_status === "completed" ? "success" : "brand"}>
              {FULFILMENT_STATUS_LABELS[order.fulfilment_status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* What to do next */}
      {next ? (
        <div className="flex flex-col gap-3 rounded-xl border border-(--color-brand)/30 bg-(--color-brand-subtle) p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-(--color-ink)">Next step</p>
            <p className="text-sm text-(--color-ink-muted)">{next.hint}</p>
          </div>
          <form action={updateFulfilmentStatusAction.bind(null, slug, orderId, next.to)}>
            <SubmitButton pendingLabel="Saving…" className="w-full sm:w-auto">
              {next.label}
            </SubmitButton>
          </form>
        </div>
      ) : !paid && !closed ? (
        <div className="rounded-xl border border-(--color-warning)/30 bg-(--color-warning-subtle) p-4 text-sm">
          <p className="font-medium text-(--color-ink)">Waiting for payment</p>
          <p className="mt-0.5 text-(--color-ink-muted)">
            Paystack hasn&apos;t confirmed a payment for this order yet. Don&apos;t send it until it shows as paid.
          </p>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-(--color-border)">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 text-(--color-ink)">
                  <span className="font-medium">{item.product_name}</span>
                  <span className="text-(--color-ink-muted)"> × {item.quantity}</span>
                  {item.is_preorder && (
                    <span className="ml-2 inline-block align-middle">
                      <Badge tone="brand">Pre-order</Badge>
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-(--color-ink)">{formatCurrency(item.line_total, order.currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-(--color-border) pt-3 text-sm">
            <div className="flex justify-between text-(--color-ink-muted)">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatCurrency(order.subtotal, order.currency)}</dd>
            </div>
            <div className="flex justify-between text-(--color-ink-muted)">
              <dt>Delivery</dt>
              <dd className="tabular-nums">{formatCurrency(order.delivery_fee, order.currency)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-(--color-ink-muted)">
                <dt>Discount</dt>
                <dd className="tabular-nums">-{formatCurrency(order.discount, order.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-1 text-base font-semibold text-(--color-ink)">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCurrency(order.total, order.currency)}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p className="font-medium text-(--color-ink)">{customerName}</p>
            {customer?.phone && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${customer.phone}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--color-border) px-3 font-medium text-(--color-ink) hover:bg-(--color-surface-subtle)"
                >
                  <Phone className="h-4 w-4" aria-hidden /> {customer.phone}
                </a>
                <a
                  href={whatsappLink(customer.phone, `Hi ${customer.first_name ?? ""}, about your order ${order.order_number}`.trim())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--color-border) px-3 font-medium text-(--color-ink) hover:bg-(--color-surface-subtle)"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            )}
            {customer?.email && (
              <a href={`mailto:${customer.email}`} className="flex min-w-0 items-center gap-1.5 text-(--color-brand) hover:underline">
                <Mail className="h-4 w-4 shrink-0" aria-hidden /> <span className="truncate">{customer.email}</span>
              </a>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{order.delivery_method === "pickup" ? "Pickup" : "Delivery"}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm text-(--color-ink)">
            {order.delivery_method === "pickup" ? (
              <p className="flex items-start gap-2">
                <Store className="mt-0.5 h-4 w-4 shrink-0 text-(--color-ink-muted)" aria-hidden />
                The customer will collect this order.
              </p>
            ) : address ? (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-(--color-ink-muted)" aria-hidden />
                <span>
                  {address.address_line}
                  {address.city ? `, ${address.city}` : ""}
                  {address.region ? `, ${address.region}` : ""}
                </span>
              </p>
            ) : (
              <p className="flex items-start gap-2 text-(--color-ink-muted)">
                <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                No delivery address (digital products or services only).
              </p>
            )}
            {order.notes && (
              <p className="rounded-md bg-(--color-surface-subtle) px-3 py-2 text-(--color-ink-muted)">
                <span className="font-medium text-(--color-ink)">Note from customer: </span>
                {order.notes}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update status</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-(--color-ink)">Fulfilment</p>
            {closed ? (
              <p className="text-sm text-(--color-ink-muted)">
                This order is {FULFILMENT_STATUS_LABELS[order.fulfilment_status].toLowerCase()} and its stock has been
                returned, so it can&apos;t be reopened. Ask the customer to order again if needed.
              </p>
            ) : (
              <StatusSelect
                label="Fulfilment status"
                value={order.fulfilment_status}
                options={Object.entries(FULFILMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                confirm={{
                  cancelled: {
                    title: "Cancel this order?",
                    description: paid
                      ? "Its items go back into stock. Cancelling here doesn't refund the customer; do that from your Paystack dashboard. This can't be undone."
                      : "Its items go back into stock. This can't be undone.",
                    confirmLabel: "Cancel order",
                  },
                  refunded: {
                    title: "Mark as refunded?",
                    description:
                      "This only records the refund here and returns the items to stock. Send the money back from your Paystack dashboard. This can't be undone.",
                    confirmLabel: "Mark as refunded",
                  },
                }}
                onChange={async (value) => {
                  "use server";
                  await updateFulfilmentStatusAction(slug, orderId, value as never);
                }}
              />
            )}
          </div>

          <div className="border-t border-(--color-border) pt-5">
            <p className="text-sm font-medium text-(--color-ink)">Payment</p>
            <p className="mb-2 mt-0.5 text-sm text-(--color-ink-muted)">
              Paystack updates this automatically. Change it only for cash or Mobile Money you received directly.
            </p>
            <StatusSelect
              label="Payment status"
              value={order.payment_status}
              options={Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              confirm={{
                paid: {
                  title: "Mark as paid?",
                  description:
                    "Only do this if you've received the money yourself (cash or Mobile Money sent to you). Paystack hasn't confirmed it, and the items will be taken out of stock.",
                  confirmLabel: "Yes, I've been paid",
                },
                refunded: {
                  title: "Mark payment as refunded?",
                  description: "This only records it here. Send the money back from your Paystack dashboard or directly.",
                  confirmLabel: "Mark as refunded",
                },
              }}
              onChange={async (value) => {
                "use server";
                await updatePaymentStatusAction(slug, orderId, value as never);
              }}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
