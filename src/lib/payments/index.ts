import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaystackProvider } from "@/lib/payments/paystack";
import { PaymentProviderNotConfiguredError, type PaymentProvider } from "@/lib/payments/types";

export type { PaymentProvider } from "@/lib/payments/types";
export { PaymentProviderNotConfiguredError } from "@/lib/payments/types";

/**
 * Loads the payment provider configured for a store. Always goes through
 * the service-role client -- store_payment_credentials has no RLS policy
 * for any client role, by design (see 0010_rls_policies.sql).
 */
export async function getPaymentProviderForStore(storeId: string): Promise<PaymentProvider> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("store_payment_credentials")
    .select("provider, secret_key")
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.secret_key) throw new PaymentProviderNotConfiguredError(storeId);

  switch (data.provider) {
    case "paystack":
      return new PaystackProvider(data.secret_key);
    default:
      throw new Error(`Unsupported payment provider: ${data.provider}`);
  }
}

export async function isPaymentProviderConfigured(storeId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("store_payment_credentials")
    .select("secret_key, public_key")
    .eq("store_id", storeId)
    .maybeSingle();

  return Boolean(data?.secret_key && data?.public_key);
}
