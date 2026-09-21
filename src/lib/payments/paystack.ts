import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  InitializeTransactionInput,
  InitializeTransactionResult,
  PaymentProvider,
  VerifiedTransactionStatus,
  VerifyTransactionResult,
} from "@/lib/payments/types";

const PAYSTACK_API_BASE = "https://api.paystack.co";

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: { authorization_url: string; access_code: string; reference: string };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string | null;
    [key: string]: unknown;
  };
}

function mapStatus(paystackStatus: string): VerifiedTransactionStatus {
  if (paystackStatus === "success") return "success";
  if (paystackStatus === "abandoned") return "abandoned";
  return "failed";
}

export class PaystackProvider implements PaymentProvider {
  readonly name = "paystack";

  constructor(private readonly secretKey: string) {}

  async initializeTransaction(
    input: InitializeTransactionInput,
  ): Promise<InitializeTransactionResult> {
    const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amountMinorUnits,
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata ?? {},
      }),
      cache: "no-store",
    });

    const body = (await response.json()) as PaystackInitializeResponse;

    if (!response.ok || !body.status || !body.data) {
      throw new Error(`Paystack initialize failed: ${body.message || response.statusText}`);
    }

    return {
      authorizationUrl: body.data.authorization_url,
      accessCode: body.data.access_code,
      reference: body.data.reference,
    };
  }

  async verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
    const response = await fetch(
      `${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
        cache: "no-store",
      },
    );

    const body = (await response.json()) as PaystackVerifyResponse;

    if (!response.ok || !body.data) {
      throw new Error(`Paystack verify failed: ${body.message || response.statusText}`);
    }

    return {
      status: mapStatus(body.data.status),
      reference: body.data.reference,
      amountMinorUnits: body.data.amount,
      currency: body.data.currency,
      channel: body.data.channel ?? null,
      paidAt: body.data.paid_at ?? null,
      raw: body.data,
    };
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader) return false;

    const expected = createHmac("sha512", this.secretKey).update(rawBody).digest("hex");

    const expectedBuf = Buffer.from(expected, "utf8");
    const receivedBuf = Buffer.from(signatureHeader, "utf8");

    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  }
}
