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
    <div className="min-h-dvh">
      <main id="main" className="mx-auto max-w-xl px-4 py-12">
        <p className="mb-6 text-sm font-semibold text-(--color-ink)">{PLATFORM_NAME}</p>
        <SignupProgress current={3} />
        <h1 className="mb-8 text-2xl font-semibold tracking-tight text-(--color-ink)">Store details</h1>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 sm:p-8">
          <StoreForm />
        </div>
      </main>
    </div>
  );
}
