"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const INTERVAL_MS = 5000;
const MAX_CHECKS = 12; // about a minute, then the shopper decides

/**
 * The "still waiting" state for any Paystack-backed payment. While pending,
 * it re-renders the (server) page every few seconds so it re-verifies with
 * Paystack. It never decides the outcome: the server page does, each time.
 */
export function PaymentPending() {
  const router = useRouter();
  const [checks, setChecks] = useState(0);
  const exhausted = checks >= MAX_CHECKS;

  useEffect(() => {
    if (exhausted) return;
    const timer = setTimeout(() => {
      setChecks((n) => n + 1);
      router.refresh();
    }, INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [checks, exhausted, router]);

  return (
    <>
      <Clock className="mx-auto h-14 w-14 text-(--color-warning)" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold text-(--color-ink)">Waiting for your payment</h1>
      <p className="mt-2 text-(--color-ink-muted)">
        Paystack hasn&apos;t confirmed this payment yet. If you paid with Mobile Money, approve the prompt on your
        phone. This page updates on its own; you don&apos;t need to pay again.
      </p>
      <div className="mt-6" aria-live="polite">
        {exhausted ? (
          <Button
            variant="outline"
            onClick={() => {
              setChecks(0);
              router.refresh();
            }}
          >
            Check again
          </Button>
        ) : (
          <p className="text-sm text-(--color-ink-muted)">Checking again automatically…</p>
        )}
      </div>
    </>
  );
}
