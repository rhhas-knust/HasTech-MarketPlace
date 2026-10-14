import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsNav } from "@/components/dashboard/settings-nav";
import { isPaymentProviderConfigured } from "@/lib/payments";
import { StoreInfoForm } from "@/components/dashboard/store-info-form";
import { DeliverySettingsForm } from "@/components/dashboard/delivery-settings-form";
import { BrandingForm } from "@/components/dashboard/branding-form";
import { updateStoreInfoAction, updateDeliverySettingsAction, updateStoreBrandingAction } from "./actions";
import { uploadStoreLogo, removeStoreLogo } from "@/lib/store-logo";

export const metadata: Metadata = { title: "Store settings" };

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: settings }, paymentsReady] = await Promise.all([
    supabase.from("store_settings").select("*").eq("store_id", membership.store.id).single(),
    isPaymentProviderConfigured(membership.store.id),
  ]);
  const isPublished = Boolean(membership.store.published_at) && membership.store.status === "active";

  return (
    <div className="max-w-2xl space-y-5">
      <SettingsNav storeSlug={slug} active="store" />

      {/* Where the store stands, with the fix one tap away */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-sm text-(--color-ink-muted)">Store</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <Badge tone={isPublished ? "success" : "warning"}>{isPublished ? "Live" : "Not published"}</Badge>
            <Link href={`/dashboard/${slug}`} className="text-sm font-medium text-(--color-brand) hover:underline">
              {isPublished ? "Overview" : "Publish from Overview"}
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
          <p className="text-sm text-(--color-ink-muted)">Online payments</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <Badge tone={paymentsReady ? "success" : "warning"}>{paymentsReady ? "Paystack connected" : "Not connected"}</Badge>
            <Link href={`/dashboard/${slug}/settings/payments`} className="text-sm font-medium text-(--color-brand) hover:underline">
              {paymentsReady ? "Manage" : "Connect Paystack"}
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardBody>
          <BrandingForm
            storeName={membership.store.name}
            logoUrl={membership.store.logo_url}
            accentColor={
              typeof membership.store.theme?.accentColor === "string"
                ? membership.store.theme.accentColor
                : "#4338CA"
            }
            colorAction={updateStoreBrandingAction.bind(null, slug)}
            logoAction={uploadStoreLogo.bind(null, slug)}
            removeLogoAction={removeStoreLogo.bind(null, slug)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Store information</CardTitle>
        </CardHeader>
        <CardBody>
          <StoreInfoForm action={updateStoreInfoAction.bind(null, slug)} store={membership.store} />
        </CardBody>
      </Card>

      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery & fulfilment</CardTitle>
          </CardHeader>
          <CardBody>
            <DeliverySettingsForm action={updateDeliverySettingsAction.bind(null, slug)} settings={settings} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
