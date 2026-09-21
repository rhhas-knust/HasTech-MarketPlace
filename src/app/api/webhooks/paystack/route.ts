import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaystackProvider } from "@/lib/payments/paystack";
import { verifyAndProcessPayment } from "@/lib/payments/process";

interface PaystackWebhookBody {
  event: string;
  data: {
    reference: string;
    metadata?: { store_id?: string };
  };
}

/**
 * Paystack webhook. Signature verification happens per-store (each store
 * has its own Paystack secret key, see store_payment_credentials), so we
 * first read `data.metadata.store_id` out of the UNTRUSTED body to know
 * which store's secret to check the signature against, then verify. Only
 * once the signature is confirmed valid do we act on anything in the body
 * -- and even then, `verifyAndProcessPayment` re-fetches the transaction
 * from Paystack's API rather than trusting these webhook fields directly.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

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

  const admin = createAdminClient();
  const { data: credentials } = await admin
    .from("store_payment_credentials")
    .select("secret_key")
    .eq("store_id", storeId)
    .maybeSingle();

  if (!credentials?.secret_key) {
    return NextResponse.json({ error: "Unknown store" }, { status: 404 });
  }

  const provider = new PaystackProvider(credentials.secret_key);
  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (body.event === "charge.success") {
    try {
      await verifyAndProcessPayment(storeId, reference);
    } catch (err) {
      console.error("Paystack webhook processing failed", err);
      // Still 200: Paystack retries on non-2xx, and a processing error here
      // (e.g. no local payment row yet, in a race with checkout redirect)
      // will resolve itself when the checkout success page's own
      // verification call runs, or on Paystack's automatic retry.
    }
  }

  return NextResponse.json({ received: true });
}
