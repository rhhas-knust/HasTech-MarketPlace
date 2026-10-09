import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { DEFAULT_SELLER_REFUND_POLICY } from "@/lib/legal";
import { PLATFORM_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `Refunds for orders placed on ${PLATFORM_NAME} stores, and for ${PLATFORM_NAME} platform fees.`,
};

export default function RefundsPage() {
  return (
    <LegalPage title="Refund Policy">
      <p>
        This page covers two things: refunds for orders you place with a store, and refunds of the fees sellers pay us.
      </p>

      <h2 id="orders">Orders from a store</h2>
      <p>
        Each store sets its own refund and returns policy, shown on a &ldquo;Refunds&rdquo; link at the bottom of the store.
        To ask for a refund, contact the seller using the details on their store and include your order number.
      </p>
      <p>
        Payments go to the seller&rsquo;s own Paystack account, so the seller issues the refund, not {PLATFORM_NAME}. If a
        seller doesn&rsquo;t reply within 7 days, <Link href="/contact">tell us</Link> and we will follow up with them. A
        seller who repeatedly ignores valid refund requests can have their store suspended.
      </p>

      <h2 id="seller-default">Default seller policy</h2>
      <p>If a store hasn&rsquo;t published its own policy, this one applies:</p>
      <ul>
        {DEFAULT_SELLER_REFUND_POLICY.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p>
        If a seller hasn&rsquo;t shown the information the Electronic Transactions Act, 2008 (Act 772) requires, such as
        their address or this policy, you may cancel within 14 days and are entitled to a refund within 30 days of
        cancelling.
      </p>

      <h2 id="platform-fees">Platform fees paid by sellers</h2>
      <ul>
        <li>
          <strong>Monthly plan:</strong> if you ask within 7 days of paying and haven&rsquo;t received a paid order during
          that month, we refund the fee in full. After that, the month is not refundable, but you can choose not to renew.
        </li>
        <li>
          <strong>Commission:</strong> if you refund a customer in full for an order, the commission on that order is
          removed or refunded. Ask us from the <Link href="/contact">contact form</Link> with the order number.
        </li>
        <li>
          <strong>Charged in error:</strong> any duplicate or incorrect charge is refunded in full.
        </li>
        <li id="sponsored">
          <strong>Sponsored placements:</strong> weeks that haven&apos;t started yet are refunded in full on request.
          Once a week has started it isn&apos;t refundable, unless we suspend or remove the promotion ourselves, in which
          case unused days are refunded.
        </li>
      </ul>
      <p>
        Fee refunds go back to the payment method you used through Paystack, usually within 5 to 10 working days.
        Paystack&rsquo;s own processing fees on the original payment may not be returned by Paystack.
      </p>
    </LegalPage>
  );
}
