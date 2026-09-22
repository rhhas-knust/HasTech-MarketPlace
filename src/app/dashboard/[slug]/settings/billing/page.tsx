import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getPlatformBilling, getUnsettledCommissionTotal } from "@/lib/payments/platform";
import { formatCurrency } from "@/lib/money";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BillingPlanForm } from "@/components/dashboard/billing-plan-form";
import { updateBillingPlanAction, payPlatformFeeAction } from "./actions";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const billing = await getPlatformBilling(membership.store.id);
  if (!billing) redirect(`/dashboard/${slug}/settings`);

  const unsettledCommission =
    billing.billingPlan === "commission" ? await getUnsettledCommissionTotal(membership.store.id) : 0;

  const subscriptionActive =
    billing.subscriptionStatus === "active" &&
    billing.subscriptionCurrentPeriodEnd &&
    new Date(billing.subscriptionCurrentPeriodEnd) > new Date();

  return (
    <div className="max-w-xl space-y-6">
      <Link href={`/dashboard/${slug}/settings`} className="inline-flex items-center gap-1 text-sm text-(--color-ink-muted) hover:text-(--color-ink)">
        <ArrowLeft className="h-4 w-4" /> Back to settings
      </Link>

      {billing.isFoundingMember && (
        <Card className="border-(--color-brand) bg-(--color-brand-subtle)">
          <CardBody>
            <p className="text-sm font-semibold text-(--color-ink)">You&apos;re a founding member 🎉</p>
            <p className="mt-1 text-sm text-(--color-ink-muted)">
              As one of our first five sellers, every platform fee is waived until{" "}
              {new Date(billing.foundingMemberUntil!).toLocaleDateString("en-GH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              . Pick a plan below for after that — you won&apos;t be charged until then.
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
        </CardHeader>
        <CardBody>
          <BillingPlanForm action={updateBillingPlanAction.bind(null, slug)} currentPlan={billing.billingPlan} />
        </CardBody>
      </Card>

      {billing.billingPlan === "commission" ? (
        <Card>
          <CardHeader>
            <CardTitle>Commission owed</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-(--color-ink-muted)">
              5% of each paid order accrues here as it comes in. Settle whenever you like.
            </p>
            <p className="mt-3 text-2xl font-semibold text-(--color-ink)">
              {formatCurrency(unsettledCommission)}
            </p>
            {unsettledCommission > 0 && !billing.isFoundingMember && (
              <form action={payPlatformFeeAction.bind(null, slug, "commission_settlement")} className="mt-4">
                <Button type="submit" size="sm">
                  Settle now
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-(--color-ink-muted)">
              {formatCurrency(billing.subscriptionPrice)} per month, paid manually — we&apos;ll add reminders
              before your period ends.
            </p>
            <p className="mt-3 text-sm font-medium text-(--color-ink)">
              {subscriptionActive
                ? `Active until ${new Date(billing.subscriptionCurrentPeriodEnd!).toLocaleDateString("en-GH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`
                : billing.subscriptionStatus === "past_due"
                  ? "Past due"
                  : "Not yet active"}
            </p>
            {!subscriptionActive && !billing.isFoundingMember && (
              <form action={payPlatformFeeAction.bind(null, slug, "subscription")} className="mt-4">
                <Button type="submit" size="sm">
                  Pay {formatCurrency(billing.subscriptionPrice)} for this month
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
