"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
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
        <div key={state.order.orderNumber} className="enter mt-8 rounded-xl border border-(--color-border) p-4" style={{ animationDuration: "400ms" }}>
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
          <OrderProgress status={state.order.fulfilmentStatus} />
          <ul className="mt-4 space-y-1 text-sm text-(--color-ink-muted)">
            {state.order.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span>
                  {item.name} × {item.quantity}
                </span>
                {item.downloadUrl && (
                  <a
                    href={item.downloadUrl}
                    className="flex shrink-0 items-center gap-1 text-(--color-brand) hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 font-medium text-(--color-ink)">Total: {state.order.total}</p>
        </div>
      )}
    </div>
  );
}

const PROGRESS_STEPS = [
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
];

/** A four-step bar that fills up to the order's current stage. */
function OrderProgress({ status }: { status: string }) {
  if (status === "cancelled" || status === "refunded") return null;
  const reached = status === "pending" ? -1 : PROGRESS_STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Order progress">
      {PROGRESS_STEPS.map((step, i) => (
        <li key={step.key} aria-current={i === reached ? "step" : undefined}>
          <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-(--color-border)">
            {i <= reached && (
              <span
                className="progress-fill block h-full origin-left rounded-full bg-(--store-accent)"
                style={{ animationDelay: `${150 + i * 180}ms` }}
              />
            )}
          </span>
          <span className={`mt-1.5 block text-xs ${i <= reached ? "font-medium text-(--color-ink)" : "text-(--color-ink-muted)"}`}>
            {step.label}
            <span className="sr-only">{i < reached ? ", done" : i === reached ? ", current" : ""}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
