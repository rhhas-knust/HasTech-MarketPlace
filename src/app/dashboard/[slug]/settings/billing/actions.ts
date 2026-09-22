"use server";

import { redirect } from "next/navigation";
import { requireStoreAccess, getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/app-url";
import { getPlatformBilling, getUnsettledCommissionTotal, initializePlatformPayment } from "@/lib/payments/platform";
import { logAudit } from "@/lib/audit";

export interface BillingFormState {
  error?: string;
}

export async function updateBillingPlanAction(
  storeSlug: string,
  _prevState: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const plan = formData.get("billingPlan");
  if (plan !== "commission" && plan !== "subscription") return { error: "Choose a plan." };

  // Admin client: platform_billing has no client-facing write policy (see
  // 0016_platform_billing.sql) -- commission_rate/subscription_price/
  // founding-member status must never be reachable from the browser, so
  // even this self-service plan switch goes through server code that only
  // ever touches the one column it means to.
  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_billing")
    .update({ billing_plan: plan })
    .eq("store_id", membership.store.id);
  if (error) return { error: "Could not save your plan. Please try again." };

  await logAudit(
    membership.store.id,
    membership.store.owner_id,
    "store.billing_plan_changed",
    "platform_billing",
    membership.store.id,
    { plan },
  );
  return {};
}

export async function payPlatformFeeAction(
  storeSlug: string,
  kind: "subscription" | "commission_settlement",
  _formData: FormData,
): Promise<void> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) redirect("/dashboard");

  const user = await getCurrentUser();
  if (!user?.email) redirect(`/dashboard/${storeSlug}/settings/billing`);

  const billing = await getPlatformBilling(membership.store.id);
  if (!billing) redirect(`/dashboard/${storeSlug}/settings/billing`);

  const amount =
    kind === "subscription" ? billing.subscriptionPrice : await getUnsettledCommissionTotal(membership.store.id);
  if (amount <= 0) redirect(`/dashboard/${storeSlug}/settings/billing`);

  const appUrl = await getAppUrl();
  const { authorizationUrl } = await initializePlatformPayment(
    membership.store.id,
    kind,
    amount,
    user.email,
    `${appUrl}/dashboard/${storeSlug}/settings/billing/callback`,
  );
  redirect(authorizationUrl);
}
