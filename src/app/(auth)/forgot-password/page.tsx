import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { requestPasswordResetAction } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-(--color-ink)">Reset your password</h1>
      <p className="mb-6 text-sm text-(--color-ink-muted)">
        Enter your account email and we&apos;ll send you a link to choose a new password.
      </p>
      <ForgotPasswordForm action={requestPasswordResetAction} />
      <p className="mt-6 text-center text-sm text-(--color-ink-muted)">
        <Link href="/login" className="font-medium text-(--color-brand)">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
