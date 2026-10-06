"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { AuthFormState } from "@/app/(auth)/actions";

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {mode === "signup" && (
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required autoComplete="name" />
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="mb-0">
            Password
          </Label>
          {mode === "login" && (
            <Link href="/forgot-password" className="mb-1.5 text-sm font-medium text-(--color-brand) underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          )}
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-(--color-ink-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-ink)"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>

      {mode === "signup" && (
        <div className="flex items-start gap-3">
          <input
            id="acceptTerms"
            name="acceptTerms"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-(--color-border-strong)"
          />
          <label htmlFor="acceptTerms" className="text-sm text-(--color-ink-muted)">
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-(--color-ink) underline underline-offset-4">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-(--color-ink) underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </label>
        </div>
      )}

      <div aria-live="polite">
        {state.error && (
          <p id="auth-error" role="alert" className="rounded-md bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
            {state.error}
            {state.existingAccount && (
              <>
                {" "}
                <Link href="/login" className="font-medium underline">
                  Sign in instead
                </Link>
                .
              </>
            )}
          </p>
        )}
        {state.info && (
          <p role="status" className="rounded-md bg-(--color-success-subtle) px-3 py-2 text-sm text-(--color-success)">
            {state.info}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (mode === "signup" ? "Creating account…" : "Signing in…") : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
