// All money math happens in integer minor units (pesewas/kobo/cents) to
// avoid floating point rounding drift, then is converted back to a decimal
// for storage/display. Paystack's API also expects amounts in minor units,
// so `toMinorUnits` doubles as the payment-initialisation helper.

export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinorUnits(amount: number): number {
  return Math.round(amount) / 100;
}

export function formatCurrency(amount: number, currency = "GHS", locale = "en-GH"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

export interface OrderLineInput {
  unitPrice: number;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

/**
 * The single source of truth for turning a set of cart lines into an
 * order's money fields. Used both when creating an order and when
 * re-verifying a Paystack payment amount server-side -- the frontend's
 * numbers are never trusted (spec: never trust price/total from the client).
 */
export function computeOrderTotals(
  lines: OrderLineInput[],
  { deliveryFee = 0, discount = 0 }: { deliveryFee?: number; discount?: number } = {},
): OrderTotals {
  const subtotalMinor = lines.reduce(
    (sum, line) => sum + toMinorUnits(line.unitPrice) * line.quantity,
    0,
  );
  const deliveryMinor = toMinorUnits(deliveryFee);
  const discountMinor = Math.min(toMinorUnits(discount), subtotalMinor + deliveryMinor);
  const totalMinor = subtotalMinor + deliveryMinor - discountMinor;

  return {
    subtotal: fromMinorUnits(subtotalMinor),
    deliveryFee: fromMinorUnits(deliveryMinor),
    discount: fromMinorUnits(discountMinor),
    total: fromMinorUnits(totalMinor),
  };
}

/**
 * The platform's cut of a sale, computed in minor units so a rate like
 * 5.00% never drifts against a total like 19.99 the way plain
 * floating-point multiplication (0.05 * 19.99) can.
 */
export function calculateCommission(orderTotal: number, ratePercent: number): number {
  return fromMinorUnits(Math.round(toMinorUnits(orderTotal) * (ratePercent / 100)));
}

export function isBelowFreeDeliveryThreshold(
  subtotal: number,
  freeDeliveryThreshold: number | null,
): boolean {
  if (freeDeliveryThreshold === null) return true;
  return subtotal < freeDeliveryThreshold;
}

export function resolveDeliveryFee(
  subtotal: number,
  method: "delivery" | "pickup",
  settings: { deliveryFee: number; freeDeliveryThreshold: number | null },
): number {
  if (method === "pickup") return 0;
  if (!isBelowFreeDeliveryThreshold(subtotal, settings.freeDeliveryThreshold)) return 0;
  return settings.deliveryFee;
}
