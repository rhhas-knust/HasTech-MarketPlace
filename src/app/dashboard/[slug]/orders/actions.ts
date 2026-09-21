"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreAccess } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import type { FulfilmentStatus, PaymentStatus } from "@/lib/types/database";

export async function updateFulfilmentStatusAction(
  storeSlug: string,
  orderId: string,
  status: FulfilmentStatus,
): Promise<void> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return;

  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({ fulfilment_status: status })
    .eq("id", orderId)
    .eq("store_id", membership.store.id);

  await logAudit(membership.store.id, membership.store.owner_id, "order.status_changed", "order", orderId, { status });
  revalidatePath(`/dashboard/${storeSlug}/orders/${orderId}`);
  revalidatePath(`/dashboard/${storeSlug}/orders`);
}

/**
 * For sellers who accept cash-on-delivery or mobile money paid directly to
 * them outside Paystack. Marking an order paid here does NOT touch Paystack
 * -- it is the seller confirming money they already received, which is
 * legitimately their call for their own store's order (unlike a customer
 * claiming payment succeeded, which we never trust -- see the Paystack
 * webhook/verification flow for that path).
 */
export async function updatePaymentStatusAction(
  storeSlug: string,
  orderId: string,
  status: PaymentStatus,
): Promise<void> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return;

  const supabase = await createClient();
  await supabase
    .from("orders")
    .update({ payment_status: status })
    .eq("id", orderId)
    .eq("store_id", membership.store.id);

  await logAudit(membership.store.id, membership.store.owner_id, "order.payment_status_changed", "order", orderId, {
    status,
  });
  revalidatePath(`/dashboard/${storeSlug}/orders/${orderId}`);
  revalidatePath(`/dashboard/${storeSlug}/orders`);
}
