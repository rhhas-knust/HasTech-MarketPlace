import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { requireStoreAccess } from "@/lib/auth/session";
import { isPaymentProviderConfigured } from "@/lib/payments";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentsForm } from "@/components/dashboard/payments-form";
import { updatePaymentCredentialsAction } from "../actions";

export const metadata: Metadata = { title: "Payment settings" };

export default async function PaymentsSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const configured = await isPaymentProviderConfigured(membership.store.id);

  return (
    <div className="max-w-xl space-y-6">
      <SettingsNav storeSlug={slug} active="payments" />
      <Card>
        <CardHeader>
          <CardTitle>Paystack</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-4 text-sm text-(--color-ink-muted)">
            Find your API keys in your{" "}
            <a
              href="https://dashboard.paystack.com/#/settings/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--color-brand) hover:underline"
            >
              Paystack dashboard
            </a>
            . Use test keys while you&apos;re setting up, then switch to live keys when you&apos;re ready to accept
            real payments.
          </p>
          <PaymentsForm action={updatePaymentCredentialsAction.bind(null, slug)} configured={configured} />
        </CardBody>
      </Card>
    </div>
  );
}
