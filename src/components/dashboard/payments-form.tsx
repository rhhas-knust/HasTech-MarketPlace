"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldHint } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { SettingsFormState } from "@/app/dashboard/[slug]/settings/actions";

export function PaymentsForm({
  action,
  configured,
}: {
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  configured: boolean;
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(action, {});

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-(--color-ink-muted)">Status:</span>
        <Badge tone={configured ? "success" : "warning"}>{configured ? "Connected" : "Not connected"}</Badge>
      </div>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="publicKey">Paystack public key</Label>
          <Input id="publicKey" name="publicKey" placeholder="pk_live_… or pk_test_…" required />
        </div>
        <div>
          <Label htmlFor="secretKey">Paystack secret key</Label>
          <Input id="secretKey" name="secretKey" type="password" placeholder="sk_live_… or sk_test_…" required />
          <FieldHint>
            Your secret key is stored securely and is never sent to your storefront or shown again after saving.
          </FieldHint>
        </div>

        {state.error && <p className="text-sm text-(--color-danger)">{state.error}</p>}
        {state.success && <p className="text-sm text-(--color-success)">Payment settings saved.</p>}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : configured ? "Update keys" : "Connect Paystack"}
        </Button>
      </form>
    </div>
  );
}
