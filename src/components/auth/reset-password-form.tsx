"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldHint } from "@/components/ui/input";
import type { AuthFormState } from "@/app/(auth)/actions";

export function ResetPasswordForm({
  action,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, {});
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {mismatch && <FieldHint>Passwords don&apos;t match.</FieldHint>}
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending || mismatch || !password}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
