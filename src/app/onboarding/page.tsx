import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, getUserStores } from "@/lib/auth/session";
import { StoreForm } from "@/components/onboarding/store-form";
import { SignupProgress } from "@/components/signup-progress";
import { PLATFORM_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Create your store" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stores = await getUserStores();
  if (stores.length > 0) redirect(`/dashboard/${stores[0].store.slug}`);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-xl px-4 py-12">
        <p className="mb-4 text-sm font-medium text-(--color-brand)">{PLATFORM_NAME}</p>
        <SignupProgress current={3} />
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-(--color-ink)">Last step: your store details</h1>
        <p className="mb-8 text-sm text-(--color-ink-muted)">
          This becomes your storefront. Your welcome gift opens as soon as it&apos;s created.
        </p>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-7 shadow-raised sm:p-8">
          <StoreForm />
        </div>
      </div>
    </div>
  );
}
