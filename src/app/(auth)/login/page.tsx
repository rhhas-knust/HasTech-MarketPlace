import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";
import { loginAction } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ signedOut?: string }>;
}) {
  const { signedOut } = await searchParams;

  return (
    <div>
      {signedOut && (
        <p
          role="status"
          className="enter mb-6 rounded-md border border-(--color-border) bg-(--color-surface-subtle) px-3 py-2 text-sm text-(--color-ink)"
          style={{ animationDuration: "300ms" }}
        >
          You&apos;ve signed out.
        </p>
      )}
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-(--color-ink)">Sign in</h1>
      <GoogleButton />
      <OrDivider />
      <AuthForm mode="login" action={loginAction} />
      <p className="mt-6 text-center text-sm text-(--color-ink-muted)">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-(--color-brand) underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
