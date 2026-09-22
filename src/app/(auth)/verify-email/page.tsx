import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { verifyEmailCodeAction, resendVerificationCodeAction } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  if (!email) redirect("/signup");

  const boundVerify = verifyEmailCodeAction.bind(null, email);
  const boundResend = resendVerificationCodeAction.bind(null, email);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-(--color-ink)">Check your email</h1>
      <p className="mb-6 text-sm text-(--color-ink-muted)">
        We sent a 6-digit code and a confirmation link to <strong>{email}</strong>.
      </p>
      <VerifyEmailForm email={email} verifyAction={boundVerify} resendAction={boundResend} />
    </div>
  );
}
