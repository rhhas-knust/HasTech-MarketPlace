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

/**
 * "pending" covers transactions that haven't finished yet (e.g. a Mobile
 * Money prompt the customer hasn't approved). It must never be recorded as
 * a failure: the same reference can still succeed a minute later.
 */
export type VerifiedTransactionStatus = "success" | "failed" | "abandoned" | "pending";

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
