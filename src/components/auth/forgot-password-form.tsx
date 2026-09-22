"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { AuthFormState } from "@/app/(auth)/actions";

export function ForgotPasswordForm({
  action,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
          {state.error}
        </p>
      )}
      {state.info && (
        <p role="status" className="rounded-lg bg-(--color-success-subtle) px-3 py-2 text-sm text-(--color-success)">
          {state.info}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending || !!state.info}>
        {pending ? "Sending…" : state.info ? "Link sent" : "Send reset link"}
      </Button>
    </form>
  );
}
