import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, getUserStores } from "@/lib/auth/session";
import { StoreForm } from "@/components/onboarding/store-form";
import { PLATFORM_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Create your store" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stores = await getUserStores();
  if (stores.length > 0) redirect(`/dashboard/${stores[0].store.slug}`);

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-12">
      <p className="mb-1 text-sm font-medium text-(--color-brand)">{PLATFORM_NAME}</p>
      <h1 className="mb-1 text-2xl font-semibold text-(--color-ink)">Tell us about your business</h1>
      <p className="mb-8 text-sm text-(--color-ink-muted)">
        This becomes your storefront. You can add products and payments next.
      </p>
      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
        <StoreForm />
      </div>
    </div>
  );
}
