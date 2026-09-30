import "server-only";
import { Resend } from "resend";

// Resend's shared onboarding@resend.dev sender can only deliver to the
// Resend account's own verified email -- it 403s on any other recipient.
// Real customer/seller delivery needs a domain we control, verified in
// Resend (see README / conversation history). Until that happens, this
// stays functionally inert for real traffic without needing a code change
// later -- just set EMAIL_FROM to the verified address once it exists.
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "HASTECH Commerce <onboarding@resend.dev>";

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Best-effort email send. Never throws: a missing API key, a Resend outage,
 * or a rejected recipient (e.g. the resend.dev sandbox restriction above)
 * are all logged and swallowed rather than breaking whatever order/payment
 * flow triggered the email. Nothing about checkout, payment verification,
 * or the dashboard should ever depend on an email actually going out.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const client = getClient();
  if (!client) {
    console.warn(`[email] RESEND_API_KEY not set -- skipped "${input.subject}" to ${input.to}`);
    return;
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (error) console.error("[email] Resend rejected the send", error);
  } catch (err) {
    console.error("[email] send failed", err);
  }
}
