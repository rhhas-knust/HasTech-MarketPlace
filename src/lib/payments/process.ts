import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProviderForStore } from "@/lib/payments";
import { recordCommissionForOrder } from "@/lib/payments/platform";
import { sendOrderPaidEmails } from "@/lib/order-emails";
import { fromMinorUnits, toMinorUnits } from "@/lib/money";

export interface PaymentVerificationResult {
  orderId: string;
  orderNumber: string | null;
  /**
   * "paid": this call confirmed the payment. "already_paid": the order was
   * already paid (by an earlier call or the webhook). Both mean the order's
   * payment_status really is "paid"; nothing else does. "pending": Paystack
   * hasn't finished (e.g. an unapproved Mobile Money prompt), check again.
   */
  status: "paid" | "already_paid" | "pending" | "failed";
}

/**
 * Starts a Paystack transaction for an order that already exists in our
 * database. The amount sent to Paystack is `order.total` as stored server
 * side -- the checkout form never gets a chance to influence it. Each call
 * creates a fresh `payments` row with its own reference, so a customer
 * whose card was declined can simply try again without us reusing a
 * possibly-tainted reference.
 */
export async function initializeOrderPayment(
  storeId: string,
  orderId: string,
  email: string,
  callbackUrl: string,
): Promise<{ authorizationUrl: string; reference: string }> {
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select("id, total, currency, order_number")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .single();
  if (error || !order) throw error ?? new Error("Order not found");

  const reference = `${order.order_number}-${Date.now().toString(36)}`;

  const { error: paymentError } = await admin.from("payments").insert({
    store_id: storeId,
    order_id: order.id,
    reference,
    amount: order.total,
    currency: order.currency,
  });
  if (paymentError) throw paymentError;

  const provider = await getPaymentProviderForStore(storeId);
  const result = await provider.initializeTransaction({
    email,
    amountMinorUnits: toMinorUnits(order.total),
    currency: order.currency,
    reference,
    callbackUrl,
    metadata: { order_id: order.id, order_number: order.order_number, store_id: storeId },
  });

  return { authorizationUrl: result.authorizationUrl, reference: result.reference };
}

/**
 * The single authoritative place where a Paystack reference turns into an
 * order state change. Called from both the webhook handler and the checkout
 * success page, in any order and any number of times.
 *
 * Never trusts the browser: it re-fetches the transaction from Paystack's
 * API, checks the reference, amount and currency against what we stored when
 * the order was created, and only then moves the order to paid.
 *
 * Idempotency comes from the order row itself: the move to "paid" is a
 * conditional update (only from pending/failed), so exactly one caller wins
 * and runs the side effects. Everything before that point can be retried
 * safely, so a crash part-way leaves the order recoverable rather than stuck.
 * payment_events is an audit trail of what Paystack told us, not a gate.
 */
export async function verifyAndProcessPayment(
  storeId: string,
  reference: string,
): Promise<PaymentVerificationResult> {
  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("id, order_id, amount, currency, status")
    .eq("store_id", storeId)
    .eq("reference", reference)
    .maybeSingle();

  if (!payment) throw new Error(`No local payment record for reference ${reference}`);

  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, payment_status")
    .eq("id", payment.order_id)
    .eq("store_id", storeId)
    .single();
  if (!order) throw new Error(`No order for payment reference ${reference}`);

  const result = (status: PaymentVerificationResult["status"]): PaymentVerificationResult => ({
    orderId: order.id,
    orderNumber: order.order_number,
    status,
  });

  if (order.payment_status === "paid") {
    // A previous call may have stopped right after marking the order paid;
    // the ledger's unique order_id makes this a no-op when it already exists.
    if (payment.status === "success") await recordCommissionForOrder(storeId, order.id, payment.amount);
    return result("already_paid");
  }

  const provider = await getPaymentProviderForStore(storeId);
  const verification = await provider.verifyTransaction(reference);

  if (verification.reference !== reference) {
    throw new Error(`Paystack returned reference ${verification.reference} for ${reference}`);
  }

  // Not finished yet: record nothing, so the next check starts clean.
  if (verification.status === "pending") return result("pending");

  // Audit trail only. A duplicate (same reference + outcome seen before) is
  // expected on retries and deliberately ignored.
  await admin.from("payment_events").insert({
    payment_id: payment.id,
    provider: provider.name,
    event_type: `payment.${verification.status}`,
    reference,
    payload: verification.raw,
  });

  const verifiedAmount = fromMinorUnits(verification.amountMinorUnits);
  const amountMatches = Math.abs(verifiedAmount - Number(payment.amount)) < 0.01;
  const currencyMatches = verification.currency === payment.currency;

  if (verification.status !== "success" || !amountMatches || !currencyMatches) {
    await admin
      .from("payments")
      .update({ status: "failed", raw_response: verification.raw, channel: verification.channel })
      .eq("id", payment.id)
      .neq("status", "success");
    return result("failed");
  }

  await admin
    .from("payments")
    .update({ status: "success", raw_response: verification.raw, channel: verification.channel })
    .eq("id", payment.id);

  // The gate: only one caller can move this order out of pending/failed.
  // (Not from "refunded": a seller's manual decision isn't overridden.)
  const { data: won, error: orderError } = await admin
    .from("orders")
    .update({ payment_status: "paid", payment_reference: reference })
    .eq("id", order.id)
    .in("payment_status", ["pending", "failed"])
    .select("id");
  if (orderError) throw orderError;

  if (!won || won.length === 0) {
    const { data: current } = await admin.from("orders").select("payment_status").eq("id", order.id).single();
    return result(current?.payment_status === "paid" ? "already_paid" : "failed");
  }

  // Confirm fulfilment only if nobody has moved it on (e.g. cancelled it).
  await admin
    .from("orders")
    .update({ fulfilment_status: "confirmed" })
    .eq("id", order.id)
    .eq("fulfilment_status", "pending");

  await recordCommissionForOrder(storeId, order.id, payment.amount);

  await admin.from("analytics_events").insert({
    store_id: storeId,
    event_type: "purchase",
    order_id: order.id,
    metadata: { amount: payment.amount, currency: payment.currency },
  });

  // Best-effort: sendOrderPaidEmails/sendEmail never throw, but a defensive
  // catch here means even an unexpected bug in the email path can't turn
  // into a failed payment verification for something that already succeeded.
  try {
    await sendOrderPaidEmails(storeId, order.id);
  } catch (err) {
    console.error("[email] sendOrderPaidEmails failed", err);
  }

  return result("paid");
}
