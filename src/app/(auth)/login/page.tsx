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
  searchParams: Promise<{ signedOut?: string; deletion?: string }>;
}) {
  const { signedOut, deletion } = await searchParams;
  const deletionDate =
    deletion && /^\d{4}-\d{2}-\d{2}$/.test(deletion)
      ? new Date(deletion).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })
      : null;

  return (
    <div>
      {deletionDate && (
        <p
          role="status"
          className="enter mb-6 rounded-md border border-(--color-border) bg-(--color-surface-subtle) px-3 py-2 text-sm text-(--color-ink)"
          style={{ animationDuration: "300ms" }}
        >
          Your account will be deleted on {deletionDate}. Sign in before then to cancel.
        </p>
      )}
      {signedOut && !deletionDate && (
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
