import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { data: settings } = await supabase
    .from("store_settings")
    .select("*")
    .eq("store_id", membership.store.id)
    .single();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-(--color-ink)">Settings</h1>
        <Link href={`/dashboard/${slug}/settings/payments`} className="text-sm text-(--color-brand) hover:underline">
          Payment settings →
        </Link>
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
