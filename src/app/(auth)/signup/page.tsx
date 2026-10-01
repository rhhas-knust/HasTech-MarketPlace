import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";
import { SignupProgress } from "@/components/signup-progress";
import { DraftClaimBanner } from "@/components/builder/draft-claim-banner";
import { signUpAction } from "@/app/(auth)/actions";
import { getFoundingSpotsLeft } from "@/lib/founding";
import { FOUNDING_MEMBER_LIMIT } from "@/lib/constants";

export const metadata: Metadata = { title: "Create your account" };

export const revalidate = 300;

export default async function SignupPage() {
  const spotsLeft = await getFoundingSpotsLeft();

  return (
    <div>
      <SignupProgress current={1} percent={40} />
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-(--color-ink)">Create your account</h1>
      <p className="mb-4 text-sm text-(--color-ink-muted)">You&apos;re 2 quick steps from your own store.</p>
      <DraftClaimBanner />
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-dashed border-(--color-brand)/50 bg-(--color-brand-subtle) px-4 py-3">
        <span className="text-2xl motion-safe:animate-[gift-wiggle_3s_ease-in-out_infinite]" aria-hidden>
          🎁
        </span>
        <p className="text-xs text-(--color-ink)">
          <strong className="block text-sm">A welcome gift is waiting at the finish line.</strong>
          {spotsLeft !== null && spotsLeft > 0
            ? `Founding members pay no fees this month. ${spotsLeft} of ${FOUNDING_MEMBER_LIMIT} spots left.`
            : "Launch your store to unlock it."}
        </p>
      </div>
      <GoogleButton />
      <OrDivider />
      <AuthForm mode="signup" action={signUpAction} />
      <p className="mt-6 text-center text-sm text-(--color-ink-muted)">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-(--color-brand)">
          Sign in
        </Link>
      </p>
    </div>
  );
}
