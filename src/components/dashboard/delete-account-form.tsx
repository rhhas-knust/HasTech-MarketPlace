"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { DeleteAccountState } from "@/app/dashboard/[slug]/account/actions";

export function DeleteAccountForm({
  action,
}: {
  action: (state: DeleteAccountState, formData: FormData) => Promise<DeleteAccountState>;
}) {
  const [state, formAction, pending] = useActionState<DeleteAccountState, FormData>(action, {});
  const [typed, setTyped] = useState("");
  const [understood, setUnderstood] = useState(false);
  const ready = typed.trim().toUpperCase() === "DELETE" && understood;

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-start gap-3">
        <input
          id="understand"
          name="understand"
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-(--color-danger)"
        />
        <label htmlFor="understand" className="text-sm text-(--color-ink)">
          I understand my store goes offline now and everything listed above is permanently deleted after 30 days.
        </label>
      </div>
      <div className="max-w-xs">
        <Label htmlFor="confirm">Type DELETE to confirm</Label>
        <Input
          id="confirm"
          name="confirm"
          autoComplete="off"
          autoCapitalize="characters"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          aria-describedby="confirm-hint"
        />
        <p id="confirm-hint" className="mt-1 text-xs text-(--color-ink-muted)">
          Capital letters, as shown.
        </p>
      </div>
      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="rounded-md bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" variant="danger" disabled={!ready || pending}>
        {pending ? "Scheduling…" : "Delete my account"}
      </Button>
    </form>
  );
}
