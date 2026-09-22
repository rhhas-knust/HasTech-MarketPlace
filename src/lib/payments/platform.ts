import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaystackProvider } from "@/lib/payments/paystack";
import { calculateCommission, fromMinorUnits, toMinorUnits } from "@/lib/money";
import { DEFAULT_CURRENCY } from "@/lib/constants";

/**
 * HASTECH's OWN Paystack account -- what platform_billing_payments are paid
 * into, as opposed to store_payment_credentials (each seller's own keys for
 * their storefront checkout). A single env var, not a database row: unlike
 * a seller's key this is never entered through a browser form.
 */
function getPlatformSecretKey(): string {
  const key = process.env.PAYSTACK_PLATFORM_SECRET_KEY;
  if (!key) throw new Error("Missing PAYSTACK_PLATFORM_SECRET_KEY environment variable");
  return key;
}

export function getPlatformPaymentProvider(): PaystackProvider {
  return new PaystackProvider(getPlatformSecretKey());
}

export interface PlatformBilling {
  storeId: string;
  billingPlan: "commission" | "subscription";
  commissionRate: number;
  subscriptionPrice: number;
  subscriptionStatus: "inactive" | "active" | "past_due";
  subscriptionCurrentPeriodEnd: string | null;
  isFoundingMember: boolean;
  foundingMemberUntil: string | null;
}

function isFoundingMemberActive(billing: { is_founding_member: boolean; founding_member_until: string | null }) {
  if (!billing.is_founding_member || !billing.founding_member_until) return false;
  return new Date(billing.founding_member_until).getTime() > Date.now();
}

export async function getPlatformBilling(storeId: string): Promise<PlatformBilling | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_billing")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    storeId: data.store_id,
    billingPlan: data.billing_plan,
    commissionRate: Number(data.commission_rate),
    subscriptionPrice: Number(data.subscription_price),
    subscriptionStatus: data.subscription_status,
    subscriptionCurrentPeriodEnd: data.subscription_current_period_end,
    isFoundingMember: isFoundingMemberActive(data),
    foundingMemberUntil: data.founding_member_until,
  };
}

/**
 * Records the platform's cut of a paid order. Called from
 * verifyAndProcessPayment right after an order is marked paid, so it stays
 * exactly-once for the same reason that function is (idempotency is
 * enforced upstream by payment_events, not here). A no-op for
 * subscription-plan stores.
 */
export async function recordCommissionForOrder(
  storeId: string,
  orderId: string,
  orderTotal: number,
): Promise<void> {
  const billing = await getPlatformBilling(storeId);
  if (!billing || billing.billingPlan !== "commission") return;

  const admin = createAdminClient();
  const waived = billing.isFoundingMember;
  const commissionAmount = waived ? 0 : calculateCommission(orderTotal, billing.commissionRate);

  await admin.from("platform_commission_ledger").insert({
    store_id: storeId,
    order_id: orderId,
    order_total: orderTotal,
    commission_rate: billing.commissionRate,
    commission_amount: commissionAmount,
    waived,
  });
}

export async function getUnsettledCommissionTotal(storeId: string): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_commission_ledger")
    .select("commission_amount")
    .eq("store_id", storeId)
    .eq("settled", false)
    .eq("waived", false);
  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + Number(row.commission_amount), 0);
}

function generateReference(kind: "subscription" | "commission_settlement", storeId: string): string {
  return `${kind === "subscription" ? "SUB" : "COM"}-${storeId.slice(0, 8)}-${Date.now().toString(36)}`;
}

/**
 * Starts a platform-side Paystack transaction (subscription renewal or a
 * batch commission settlement). Mirrors initializeOrderPayment in
 * lib/payments/process.ts, but against HASTECH's own Paystack account
 * rather than a store's.
 */
export async function initializePlatformPayment(
  storeId: string,
  kind: "subscription" | "commission_settlement",
  amount: number,
  email: string,
  callbackUrl: string,
): Promise<{ authorizationUrl: string; reference: string }> {
  if (amount <= 0) throw new Error("Nothing to charge.");

  const admin = createAdminClient();
  const reference = generateReference(kind, storeId);

  const { error } = await admin.from("platform_billing_payments").insert({
    store_id: storeId,
    kind,
    reference,
    amount,
    currency: DEFAULT_CURRENCY,
    status: "pending",
  });
  if (error) throw error;

  const provider = getPlatformPaymentProvider();
  const result = await provider.initializeTransaction({
    email,
    amountMinorUnits: toMinorUnits(amount),
    currency: DEFAULT_CURRENCY,
    reference,
    callbackUrl,
    metadata: { store_id: storeId, kind },
  });

  return { authorizationUrl: result.authorizationUrl, reference: result.reference };
}

export interface PlatformPaymentVerificationResult {
  status: "success" | "failed" | "already_processed";
  kind: "subscription" | "commission_settlement" | null;
}

/**
 * The authoritative place a platform payment reference turns into a state
 * change -- same shape as verifyAndProcessPayment, just against
 * platform_billing_payments/platform_billing instead of orders/stores.
 */
export async function verifyAndProcessPlatformPayment(
  storeId: string,
  reference: string,
): Promise<PlatformPaymentVerificationResult> {
  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("platform_billing_payments")
    .select("id, store_id, kind, amount, currency, status")
    .eq("store_id", storeId)
    .eq("reference", reference)
    .maybeSingle();
  if (!payment) throw new Error(`No local platform payment record for reference ${reference}`);

  if (payment.status !== "pending") {
    return { status: "already_processed", kind: payment.kind };
  }

  const provider = getPlatformPaymentProvider();
  const verification = await provider.verifyTransaction(reference);

  const verifiedAmount = fromMinorUnits(verification.amountMinorUnits);
  const amountMatches = Math.abs(verifiedAmount - Number(payment.amount)) < 0.01;
  const currencyMatches = verification.currency === payment.currency;

  if (verification.status !== "success" || !amountMatches || !currencyMatches) {
    // Race-safe: only flips a still-pending row, so a retried verify call
    // (webhook + success page) can't clobber an already-settled result.
    await admin
      .from("platform_billing_payments")
      .update({ status: "failed", raw_response: verification.raw })
      .eq("id", payment.id)
      .eq("status", "pending");
    return { status: "failed", kind: payment.kind };
  }

  const { data: updated, error: updateError } = await admin
    .from("platform_billing_payments")
    .update({ status: "success", raw_response: verification.raw })
    .eq("id", payment.id)
    .eq("status", "pending")
    .select("id");
  if (updateError) throw updateError;

  // If a concurrent call already won the race on the `status = 'pending'`
  // guard above, this UPDATE matches zero rows -- don't double-apply the
  // side effects below (extending the subscription period, settling ledger
  // rows) a second time.
  if (!updated || updated.length === 0) {
    return { status: "already_processed", kind: payment.kind };
  }

  if (payment.kind === "subscription") {
    const billing = await getPlatformBilling(payment.store_id);
    const base =
      billing?.subscriptionCurrentPeriodEnd && new Date(billing.subscriptionCurrentPeriodEnd) > new Date()
        ? new Date(billing.subscriptionCurrentPeriodEnd)
        : new Date();
    const nextPeriodEnd = new Date(base);
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

    await admin
      .from("platform_billing")
      .update({
        subscription_status: "active",
        subscription_current_period_end: nextPeriodEnd.toISOString(),
      })
      .eq("store_id", payment.store_id);
  } else {
    await admin
      .from("platform_commission_ledger")
      .update({ settled: true, settled_payment_id: payment.id })
      .eq("store_id", payment.store_id)
      .eq("settled", false)
      .eq("waived", false);
  }

  return { status: "success", kind: payment.kind };
}
