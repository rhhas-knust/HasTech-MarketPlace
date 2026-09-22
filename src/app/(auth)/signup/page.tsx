import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";
import { signUpAction } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-(--color-ink)">Create your account</h1>
      <p className="mb-6 text-sm text-(--color-ink-muted)">
        Set up your online store in a few minutes.
      </p>
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
