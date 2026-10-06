import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { ConsentSettings } from "@/components/consent-settings";
import { PLATFORM_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `The cookies and browser storage ${PLATFORM_NAME} uses, and how to change your choice.`,
};

const COOKIES = [
  {
    name: "sb-…-auth-token",
    purpose: "Keeps you signed in to your seller account.",
    type: "Essential",
    lasts: "Until you sign out",
  },
  {
    name: "hastech_cart_<store>",
    purpose: "Remembers what is in your cart at each store.",
    type: "Essential",
    lasts: "30 days",
  },
  {
    name: "hastech_consent",
    purpose: "Remembers your cookie choice.",
    type: "Essential",
    lasts: "180 days",
  },
  {
    name: "hastech_visitor_id",
    purpose: "A random ID so sellers can count product views without counting the same visitor twice.",
    type: "Analytics, only if you allow it",
    lasts: "180 days",
  },
];

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy">
      <p>
        Cookies are small files a website stores in your browser. We use as few as possible, and we use no advertising or
        third-party tracking cookies.
      </p>

      <h2 id="choice">Change your choice</h2>
      <p>
        Essential cookies are needed for sign-in and carts, so they can&rsquo;t be turned off. Analytics is off unless you
        allow it. Choosing &ldquo;Essential only&rdquo; deletes the analytics cookie straight away.
      </p>
      <div className="mt-4">
        <ConsentSettings />
      </div>

      <h2 id="list">Cookies we set</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Purpose</th>
              <th scope="col">Type</th>
              <th scope="col">Lasts</th>
            </tr>
          </thead>
          <tbody>
            {COOKIES.map((cookie) => (
              <tr key={cookie.name}>
                <td>
                  <code className="text-xs">{cookie.name}</code>
                </td>
                <td>{cookie.purpose}</td>
                <td>{cookie.type}</td>
                <td>{cookie.lasts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="storage">Browser storage</h2>
      <p>
        We also keep a few settings in your browser&rsquo;s local storage. They never leave your device: your light or dark
        theme, a store design you started before signing up, and whether you hid the founding-member note.
      </p>

      <h2 id="third-party">Other services</h2>
      <p>
        Paying takes you to Paystack, and &ldquo;Continue with Google&rdquo; takes you to Google. Those sites set their own
        cookies under their own policies. Share buttons are plain links to WhatsApp and other apps; they don&rsquo;t load
        anything until you tap them.
      </p>
    </LegalPage>
  );
}
