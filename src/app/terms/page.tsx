import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import {
  SPONSOR_WEEKLY_PRICE_GHS,
  COMMISSION_RATE_PERCENT,
  FOUNDING_FREE_MONTHS,
  FOUNDING_MEMBER_LIMIT,
  PLATFORM_NAME,
  SUBSCRIPTION_PRICE_GHS,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: `The terms for selling and buying on ${PLATFORM_NAME}.`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions">
      <p>
        These terms apply when you create a store on {PLATFORM_NAME} or buy from a store hosted on it. By creating an
        account or placing an order you agree to them. Please also read our <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/refunds">Refund Policy</Link>.
      </p>

      <h2 id="service">1. What we provide</h2>
      <p>
        {PLATFORM_NAME} gives businesses a store page, order and customer management, and a way to take payments through
        their own Paystack account. We are not the seller of the goods or services listed on a store. When you buy from a
        store, your contract is with that seller.
      </p>

      <h2 id="accounts">2. Seller accounts</h2>
      <ul>
        <li>You must be at least 18 and able to enter a contract under Ghanaian law.</li>
        <li>Give accurate details and keep your password private. You are responsible for activity on your account.</li>
        <li>You may add staff to your store. You are responsible for what they do on it.</li>
      </ul>

      <h2 id="fees">3. Plans and fees</h2>
      <p>You choose one plan for each store and can change it from your billing settings:</p>
      <ul>
        <li>
          <strong>Pay as you sell:</strong> {COMMISSION_RATE_PERCENT}% of each paid order, with no monthly fee. The
          commission builds up in your billing settings and you pay it from there.
        </li>
        <li>
          <strong>Monthly:</strong> GHS {SUBSCRIPTION_PRICE_GHS} a month, with no commission. You pay one month at a time
          from your billing settings, and it does not renew without your action.
        </li>
      </ul>
      <p>
        The first {FOUNDING_MEMBER_LIMIT} stores to join pay no platform fees for {FOUNDING_FREE_MONTHS} months from the
        day their store is created. Paystack charges its own processing fees, which are separate from ours. Fees may
        change with at least 30 days&rsquo; notice by email.
      </p>

      <h3 id="sponsored">Sponsored placements</h3>
      <p>
        Sellers can pay GHS {SPONSOR_WEEKLY_PRICE_GHS} a week to have their store shown on other stores, in one row
        labelled &ldquo;Sponsored&rdquo; and on order confirmation pages. A store is never shown on stores of the same
        business type. Placements rotate, so we don&apos;t promise a number of views or sales. Every seller can turn the
        sponsored row off on their own store.
      </p>

      <h2 id="payments">4. Payments</h2>
      <p>
        Customer payments go straight to the seller&rsquo;s Paystack account; we never hold them. An order is marked paid
        only after we confirm the amount with Paystack. Sellers must follow Paystack&rsquo;s own terms.
      </p>

      <h2 id="seller-duties">5. What sellers must do</h2>
      <p>To meet the Electronic Transactions Act, 2008 (Act 772) and protect buyers, each seller must:</p>
      <ul>
        <li>publish a business name, a contact phone or email, and a physical address on their store;</li>
        <li>describe products and services accurately, with the full price in Ghana cedis, including delivery fees;</li>
        <li>
          publish a refund and returns policy, or accept our{" "}
          <Link href="/refunds#seller-default">default seller policy</Link>;
        </li>
        <li>fulfil paid orders, or refund them promptly when they can&rsquo;t;</li>
        <li>
          use customer details only to fulfil and support orders, keep them secure, and comply with the Data Protection
          Act, 2012 (Act 843);
        </li>
        <li>hold any licence their business needs, and pay their own taxes.</li>
      </ul>

      <h2 id="prohibited">6. What you can&rsquo;t sell or do</h2>
      <ul>
        <li>Anything illegal in Ghana, including counterfeit goods, controlled drugs, weapons and stolen property.</li>
        <li>Content that infringes someone else&rsquo;s copyright or trademark.</li>
        <li>Misleading listings, fake reviews, or prices that hide extra charges.</li>
        <li>Attempts to access another store&rsquo;s data, overload the service, or get around our security.</li>
      </ul>

      <h2 id="buyers">7. Buying from a store</h2>
      <p>
        When you place an order you make an offer to the seller, which they accept by confirming or fulfilling it. Check
        your order before paying. The seller&rsquo;s refund policy, shown on their store, applies. If a seller has not
        shown the information Act 772 requires, you may have extra rights to cancel or get a refund under that Act.
      </p>

      <h2 id="content">8. Your content</h2>
      <p>
        You keep ownership of the names, photos and text you upload. You allow us to host and display them to run your
        store. You confirm you have the right to use them.
      </p>

      <h2 id="suspension">9. Suspension and closing an account</h2>
      <p>
        You can delete your account at any time from Account settings; your store goes offline at once and your data is
        erased after 30 days. We may suspend a store that breaks these terms, puts
        buyers at risk, or is required by law to be taken down. Where possible we tell you why first and give you a chance
        to fix it.
      </p>

      <h2 id="liability">10. Liability</h2>
      <p>
        We work to keep the platform available and secure but can&rsquo;t promise it will never be interrupted. We are not
        responsible for the goods or services sellers provide, or for Paystack outages. Nothing in these terms limits
        rights you have under Ghanaian consumer law. To the extent the law allows, our total liability to a seller is
        limited to the fees they paid us in the three months before the claim.
      </p>

      <h2 id="law">11. Governing law</h2>
      <p>
        These terms are governed by the laws of the Republic of Ghana. We will try to resolve any dispute with you
        informally first. If that fails, the courts of Ghana have jurisdiction.
      </p>

      <h2 id="changes">12. Changes</h2>
      <p>
        We may update these terms. For material changes we update the date above and email sellers at least 14 days
        before they take effect. Questions? <Link href="/contact">Contact us</Link>.
      </p>
    </LegalPage>
  );
}
