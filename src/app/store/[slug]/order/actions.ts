"use server";

import { z } from "zod";
import { getStoreBySlug } from "@/lib/store-data";
import { getOrderForTracking } from "@/lib/orders";
import { FULFILMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";

export interface OrderLookupState {
  error?: string;
  order?: {
    orderNumber: string;
    paymentStatusLabel: string;
    fulfilmentStatusLabel: string;
    total: string;
    createdAt: string;
    items: { name: string; quantity: number }[];
  };
}

const schema = z.object({
  orderNumber: z.string().trim().min(1),
  email: z.string().trim().email(),
});

export async function lookupOrderAction(
  storeSlug: string,
  _prevState: OrderLookupState,
  formData: FormData,
): Promise<OrderLookupState> {
  const parsed = schema.safeParse({
    orderNumber: formData.get("orderNumber"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: "Enter your order number and the email you used at checkout." };

  const store = await getStoreBySlug(storeSlug);
  if (!store) return { error: "Store not found." };

  const order = await getOrderForTracking(store.id, parsed.data.orderNumber, parsed.data.email);
  if (!order) {
    return { error: "We couldn't find an order matching that order number and email." };
  }

  return {
    order: {
      orderNumber: order.order_number,
      paymentStatusLabel: PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status,
      fulfilmentStatusLabel: FULFILMENT_STATUS_LABELS[order.fulfilment_status] ?? order.fulfilment_status,
      total: formatCurrency(order.total, order.currency),
      createdAt: new Date(order.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      items: (order.order_items as { product_name: string; quantity: number }[]).map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
      })),
    },
  };
}
