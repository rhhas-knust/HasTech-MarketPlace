import Link from "next/link";
import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { PLATFORM_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${PLATFORM_NAME} collects, uses and protects personal data under Ghana's Data Protection Act, 2012 (Act 843).`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what personal data {PLATFORM_NAME} (&ldquo;we&rdquo;) collects, why, who we share it with,
        and the rights you have under Ghana&rsquo;s Data Protection Act, 2012 (Act 843). It covers sellers who run a store
        on the platform, shoppers who buy from those stores, and anyone who contacts us.
      </p>

      <h2 id="roles">Who is responsible for your data</h2>
      <p>
        We are the data controller for seller accounts, platform billing, messages sent through our contact form, and
        cookies set on this site.
      </p>
      <p>
        When you buy from a store, the seller is the data controller for your order details and uses them to fulfil your
        order. We process that data on the seller&rsquo;s behalf, keep it secure, and do not use it for our own marketing.
        Each store page shows the seller&rsquo;s contact details.
      </p>

      <h2 id="what-we-collect">What we collect</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Who</th>
            <th scope="col">Data</th>
            <th scope="col">Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sellers</td>
            <td>Name, email, password (stored hashed), the date you accepted these terms</td>
            <td>To create and secure your account (contract)</td>
          </tr>
          <tr>
            <td>Sellers</td>
            <td>Store name, business contact phone, email, WhatsApp number and address you choose to publish</td>
            <td>To show buyers who they are dealing with, as the Electronic Transactions Act, 2008 (Act 772) requires</td>
          </tr>
          <tr>
            <td>Sellers</td>
            <td>Paystack API keys, kept in a table only our server can read</td>
            <td>To start payments into your own Paystack account (contract)</td>
          </tr>
          <tr>
            <td>Shoppers</td>
            <td>Name, email, phone, and a delivery address only when you choose delivery; order notes</td>
            <td>To process, deliver and support your order (contract)</td>
          </tr>
          <tr>
            <td>Contact form</td>
            <td>Name, email, message, and optionally phone and business name</td>
            <td>To reply to you (consent)</td>
          </tr>
          <tr>
            <td>Visitors who allow analytics</td>
            <td>A random visitor ID, pages and products viewed, and the website that referred you (hostname only)</td>
            <td>To show sellers anonymous view counts (consent, see the <Link href="/cookies">Cookie Policy</Link>)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Sponsored store links are counted as plain totals (shown, clicked, on which store), with no cookie or
        visitor ID. We never see or store card numbers or MoMo PINs. Payments are entered on Paystack&rsquo;s own pages. We do not store
        IP addresses alongside orders or analytics, and we do not collect data about children knowingly. Sellers must be
        at least 18.
      </p>

      <h2 id="sharing">Who we share it with</h2>
      <p>We share personal data only with the services needed to run the platform:</p>
      <ul>
        <li>
          <strong>Paystack</strong> processes payments for orders and platform fees.
        </li>
        <li>
          <strong>Supabase</strong> hosts our database, file storage and sign-in.
        </li>
        <li>
          <strong>Vercel</strong> hosts the website.
        </li>
        <li>
          <strong>Resend</strong> sends account emails such as verification codes.
        </li>
        <li>
          <strong>Google</strong> receives your request only if you choose &ldquo;Continue with Google&rdquo;.
        </li>
      </ul>
      <p>
        Some of these providers store data on servers outside Ghana. We use providers that protect data to a standard at
        least equal to Act 843 and bind them by contract to use it only to provide their service to us. We do not sell
        personal data or share it with advertisers. We disclose data to authorities only when Ghanaian law requires it.
      </p>

      <h2 id="retention">How long we keep it</h2>
      <ul>
        <li>
          Seller accounts: until you delete your account from Account settings. Your store goes offline at once and your
          personal data is erased 30 days later; you can cancel by signing in before then. Order amounts and dates stay,
          without customer details, for the tax period below.
        </li>
        <li>Orders and payment records: six years, as Ghanaian tax law requires business records to be kept.</li>
        <li>Contact form messages: 12 months after we close the conversation.</li>
        <li>Analytics events: 24 months. The visitor cookie expires after 180 days.</li>
      </ul>

      <h2 id="security">How we protect it</h2>
      <p>
        Connections are encrypted with HTTPS. Database access rules keep each store&rsquo;s data separate, so one seller
        cannot read another&rsquo;s customers or orders. Payment amounts are checked on our server before an order is marked
        paid. Staff access is limited to what is needed to support the platform. If a breach puts your data at risk, we
        will tell you and the Data Protection Commission as the law requires.
      </p>

      <h2 id="rights">Your rights</h2>
      <p>Under Act 843 you can:</p>
      <ul>
        <li>
          ask for a copy of the personal data we hold about you (sellers can download it themselves from Account
          settings);
        </li>
        <li>ask us to correct data that is wrong or out of date;</li>
        <li>
          ask us to delete data we no longer need or have no right to keep (sellers can delete their account themselves
          from Account settings);
        </li>
        <li>object to processing, and stop any direct marketing at any time;</li>
        <li>withdraw consent, which is as easy as giving it. For cookies, use the <Link href="/cookies">Cookie Policy</Link> page.</li>
      </ul>
      <p>
        To make a request, use the <Link href="/contact?topic=privacy">contact form</Link> and choose &ldquo;My personal
        data&rdquo;. We reply within 21 days. For order data held by a store, you can also contact the seller directly.
      </p>
      <p>
        If you are unhappy with how we handle your data, you can complain to the Data Protection Commission of Ghana at{" "}
        <a href="https://dataprotection.org.gh" rel="noopener noreferrer">
          dataprotection.org.gh
        </a>
        .
      </p>

      <h2 id="changes">Changes to this policy</h2>
      <p>
        When we make a material change, we update the date at the top and email sellers before the change takes effect.
      </p>
    </LegalPage>
  );
}
