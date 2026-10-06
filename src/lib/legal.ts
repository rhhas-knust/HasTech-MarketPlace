// Shared legal wording, so the platform /refunds page and each storefront's
// refund page can't drift apart.

/** Used on a storefront when the seller hasn't written their own policy. */
export const DEFAULT_SELLER_REFUND_POLICY: string[] = [
  "You can cancel an order for a full refund any time before the seller marks it as ready or dispatched.",
  "If an item arrives damaged, faulty, or not as described, contact the seller within 7 days of receiving it. The seller will replace it or refund you in full, including any delivery fee.",
  "Unused physical items in their original condition can be returned within 7 days of delivery. You may need to pay to send them back unless the item was faulty.",
  "Food, made-to-order and personalised items can't be returned unless they were faulty or not as ordered.",
  "Digital downloads can't be returned once downloaded, unless the file is faulty or not as described.",
  "Services can be cancelled for a full refund at least 24 hours before the booked time.",
  "Approved refunds go back to the original payment method (MoMo or card) through Paystack, usually within 5 to 10 working days.",
];
