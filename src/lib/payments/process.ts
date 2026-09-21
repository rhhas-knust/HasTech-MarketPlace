import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProviderForStore } from "@/lib/payments";
import { fromMinorUnits, toMinorUnits } from "@/lib/money";

export interface PaymentVerificationResult {
  orderId: string;
  orderNumber: string | null;
  status: "paid" | "failed" | "already_processed";
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
 * order state change. Called from both the webhook handler and the
 * checkout success page, so whichever arrives first "wins" and the other is
 * a safe no-op -- idempotency is enforced by the unique
 * (provider, reference, event_type) constraint on payment_events, not by
 * which caller happens to run first.
 *
 * Never trusts the browser: it re-fetches the transaction from Paystack's
 * API and re-derives amount/currency from there, then checks them against
 * the amount we stored when the order was created.
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
    .single();

  if (order?.payment_status === "paid") {
    return { orderId: payment.order_id, orderNumber: order.order_number, status: "already_processed" };
  }

  const provider = await getPaymentProviderForStore(storeId);
  const verification = await provider.verifyTransaction(reference);

  const eventType = `payment.${verification.status}`;
  const { error: idempotencyError } = await admin
    .from("payment_events")
    .insert({
      payment_id: payment.id,
      provider: provider.name,
      event_type: eventType,
      reference,
      payload: verification.raw,
    });

  if (idempotencyError) {
    // Unique violation => this exact (provider, reference, event_type) was
    // already recorded and processed by a previous call. No-op.
    return { orderId: payment.order_id, orderNumber: order?.order_number ?? null, status: "already_processed" };
  }

  const verifiedAmount = fromMinorUnits(verification.amountMinorUnits);
  const amountMatches = Math.abs(verifiedAmount - payment.amount) < 0.01;
  const currencyMatches = verification.currency === payment.currency;

  if (verification.status !== "success" || !amountMatches || !currencyMatches) {
    await admin
      .from("payments")
      .update({ status: "failed", raw_response: verification.raw, channel: verification.channel })
      .eq("id", payment.id);
    return { orderId: payment.order_id, orderNumber: order?.order_number ?? null, status: "failed" };
  }

  await admin
    .from("payments")
    .update({ status: "success", raw_response: verification.raw, channel: verification.channel })
    .eq("id", payment.id);

  await admin
    .from("orders")
    .update({ payment_status: "paid", payment_reference: reference, fulfilment_status: "confirmed" })
    .eq("id", payment.order_id);

  // Recorded here (not on the success page) so it fires exactly once no
  // matter whether the webhook or the customer's browser redirect wins the
  // race to call this function first.
  await admin.from("analytics_events").insert({
    store_id: storeId,
    event_type: "purchase",
    order_id: payment.order_id,
    metadata: { amount: payment.amount, currency: payment.currency },
  });

  return { orderId: payment.order_id, orderNumber: order?.order_number ?? null, status: "paid" };
}
