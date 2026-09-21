"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { OrderLookupState } from "@/app/store/[slug]/order/actions";

export function OrderLookupForm({
  action,
}: {
  action: (state: OrderLookupState, formData: FormData) => Promise<OrderLookupState>;
}) {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState<OrderLookupState, FormData>(action, {});

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="orderNumber">Order number</Label>
          <Input
            id="orderNumber"
            name="orderNumber"
            required
            defaultValue={searchParams.get("number") ?? ""}
            placeholder="e.g. AB-1000"
          />
        </div>
        <div>
          <Label htmlFor="email">Email used at checkout</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        {state.error && (
          <p role="alert" className="rounded-lg bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
            {state.error}
          </p>
        )}
        <Button type="submit" variant="store" disabled={pending}>
          {pending ? "Looking up…" : "Track order"}
        </Button>
      </form>

      {state.order && (
        <div className="mt-8 rounded-xl border border-(--color-border) p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-(--color-ink)">Order {state.order.orderNumber}</p>
            <span className="text-sm text-(--color-ink-muted)">{state.order.createdAt}</span>
          </div>
          <div className="mt-2 flex gap-2">
            <Badge tone={state.order.paymentStatusLabel === "Paid" ? "success" : "warning"}>
              Payment: {state.order.paymentStatusLabel}
            </Badge>
            <Badge tone="brand">Status: {state.order.fulfilmentStatusLabel}</Badge>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-(--color-ink-muted)">
            {state.order.items.map((item, i) => (
              <li key={i}>
                {item.name} × {item.quantity}
              </li>
            ))}
          </ul>
          <p className="mt-3 font-medium text-(--color-ink)">Total: {state.order.total}</p>
        </div>
      )}
    </div>
  );
}
