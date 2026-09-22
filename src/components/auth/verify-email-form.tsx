"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldHint } from "@/components/ui/input";
import type { VerifyEmailState } from "@/app/(auth)/actions";

export function VerifyEmailForm({
  email,
  verifyAction,
  resendAction,
}: {
  email: string;
  verifyAction: (state: VerifyEmailState, formData: FormData) => Promise<VerifyEmailState>;
  resendAction: () => Promise<VerifyEmailState>;
}) {
  const [state, formAction, pending] = useActionState<VerifyEmailState, FormData>(verifyAction, {});
  const [resendState, setResendState] = useState<VerifyEmailState>({});
  const [resending, startResend] = useTransition();

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="token">6-digit code</Label>
          <Input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            required
            className="text-center text-lg tracking-[0.5em]"
          />
          <FieldHint>Sent to {email}. Didn&apos;t get it? Check spam, or resend below.</FieldHint>
        </div>

        {state.error && (
          <p role="alert" className="rounded-lg bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
            {state.error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Verifying…" : "Verify and continue"}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="text-(--color-brand) disabled:opacity-50"
          disabled={resending}
          onClick={() =>
            startResend(async () => {
              setResendState(await resendAction());
            })
          }
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
        {resendState.info && <span className="text-(--color-success)">{resendState.info}</span>}
        {resendState.error && <span className="text-(--color-danger)">{resendState.error}</span>}
      </div>

      <p className="text-center text-xs text-(--color-ink-muted)">
        You can also open the confirmation link in the same email instead of typing a code.
      </p>
    </div>
  );
}
