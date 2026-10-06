import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";
import { SignupProgress } from "@/components/signup-progress";
import { DraftClaimBanner } from "@/components/builder/draft-claim-banner";
import { signUpAction } from "@/app/(auth)/actions";
import { getFoundingSpotsLeft } from "@/lib/founding";
import { FOUNDING_FREE_MONTHS, FOUNDING_MEMBER_LIMIT } from "@/lib/constants";

export const metadata: Metadata = { title: "Create your account" };

export const revalidate = 300;

export default async function SignupPage() {
  const spotsLeft = await getFoundingSpotsLeft();

  return (
    <div>
      <SignupProgress current={1} />
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-(--color-ink)">Create your account</h1>
      <DraftClaimBanner />
      {spotsLeft !== null && spotsLeft > 0 && (
        <p className="mb-5 text-sm text-(--color-ink-muted)">
          Founding members pay no platform fees for {FOUNDING_FREE_MONTHS} months. {spotsLeft} of{" "}
          {FOUNDING_MEMBER_LIMIT} places left.
        </p>
      )}
      <GoogleButton />
      <p className="mt-2 text-xs text-(--color-ink-muted)">
        By continuing with Google you agree to our{" "}
        <Link href="/terms" className="underline">Terms</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
      <OrDivider />
      <AuthForm mode="signup" action={signUpAction} />
      <p className="mt-6 text-center text-sm text-(--color-ink-muted)">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-(--color-brand) underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
