import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { updatePasswordAction } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-(--color-ink)">Choose a new password</h1>
      <p className="mb-6 text-sm text-(--color-ink-muted)">
        Enter a new password for your account.
      </p>
      <ResetPasswordForm action={updatePasswordAction} />
    </div>
  );
}
