"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/app-url";

export interface AuthFormState {
  error?: string;
  info?: string;
}

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (!fullName) return { error: "Your name is required" };

  const supabase = await createClient();
  const appUrl = await getAppUrl();

  // emailRedirectTo is set explicitly here rather than relying on the
  // Supabase project's "Site URL" dashboard setting -- that setting still
  // has to be added to the project's allowed Redirect URLs, but the actual
  // link used in the email is whatever we pass here, so this can never
  // silently point at whatever Site URL happens to be configured (e.g. the
  // localhost default a fresh project starts with).
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  if (!data.session) {
    redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
  }

  redirect("/onboarding");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // A user who signed up but never confirmed their email gets a specific,
    // actionable message instead of a generic "incorrect password".
    if (error.code === "email_not_confirmed") {
      redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    }
    return { error: "Incorrect email or password" };
  }

  redirect("/dashboard");
}

export interface VerifyEmailState {
  error?: string;
  info?: string;
}

export async function verifyEmailCodeAction(
  email: string,
  _prevState: VerifyEmailState,
  formData: FormData,
): Promise<VerifyEmailState> {
  const token = String(formData.get("token") ?? "").trim();
  if (!/^\d{6}$/.test(token)) return { error: "Enter the 6-digit code from your email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
  if (error) return { error: "That code is incorrect or has expired. Request a new one below." };

  redirect("/onboarding");
}

export async function resendVerificationCodeAction(email: string): Promise<VerifyEmailState> {
  const supabase = await createClient();
  const appUrl = await getAppUrl();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  });
  if (error) return { error: "Couldn't resend the code. Please try again in a moment." };
  return { info: "A new code has been sent." };
}
