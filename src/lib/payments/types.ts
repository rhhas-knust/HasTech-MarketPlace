export interface InitializeTransactionInput {
  email: string;
  amountMinorUnits: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeTransactionResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export type VerifiedTransactionStatus = "success" | "failed" | "abandoned";

export interface VerifyTransactionResult {
  status: VerifiedTransactionStatus;
  reference: string;
  amountMinorUnits: number;
  currency: string;
  channel: string | null;
  paidAt: string | null;
  raw: Record<string, unknown>;
}

/**
 * Provider-agnostic abstraction over an online payment gateway. Paystack is
 * the only implementation today; adding a second provider (e.g. Flutterwave)
 * means implementing this interface, not touching checkout/webhook code.
 */
export interface PaymentProvider {
  readonly name: string;
  initializeTransaction(input: InitializeTransactionInput): Promise<InitializeTransactionResult>;
  verifyTransaction(reference: string): Promise<VerifyTransactionResult>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
}

export class PaymentProviderNotConfiguredError extends Error {
  constructor(storeId: string) {
    super(`Store ${storeId} has not configured a payment provider yet`);
    this.name = "PaymentProviderNotConfiguredError";
  }
}
