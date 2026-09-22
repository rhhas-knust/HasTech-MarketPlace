import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";
import { loginAction } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-(--color-ink)">Welcome back</h1>
      <p className="mb-6 text-sm text-(--color-ink-muted)">Sign in to manage your store.</p>
      <GoogleButton />
      <OrDivider />
      <AuthForm mode="login" action={loginAction} />
      <p className="mt-6 text-center text-sm text-(--color-ink-muted)">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-(--color-brand)">
          Create one
        </Link>
      </p>
    </div>
  );
}
