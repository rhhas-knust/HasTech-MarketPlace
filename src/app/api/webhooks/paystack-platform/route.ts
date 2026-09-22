import { NextResponse } from "next/server";
import { getPlatformPaymentProvider, verifyAndProcessPlatformPayment } from "@/lib/payments/platform";

interface PaystackWebhookBody {
  event: string;
  data: {
    reference: string;
    metadata?: { store_id?: string };
  };
}

/**
 * Webhook for HASTECH's OWN Paystack account (subscription renewals and
 * commission settlements) -- separate from /api/webhooks/paystack, which
 * verifies against each SELLER's own secret key. This one always verifies
 * against the single platform secret key, so no per-request lookup is
 * needed before checking the signature.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const provider = getPlatformPaymentProvider();
  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: PaystackWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const storeId = body?.data?.metadata?.store_id;
  const reference = body?.data?.reference;
  if (!storeId || !reference) {
    return NextResponse.json({ error: "Missing store_id or reference" }, { status: 400 });
  }

  if (body.event === "charge.success") {
    try {
      await verifyAndProcessPlatformPayment(storeId, reference);
    } catch (err) {
      console.error("Platform Paystack webhook processing failed", err);
      // Still 200: Paystack retries on non-2xx, and this resolves itself on
      // retry or via the billing callback page's own verification call.
    }
  }

  return NextResponse.json({ received: true });
}
