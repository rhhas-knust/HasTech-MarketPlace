import { formatCurrency } from "@/lib/money";
import { PLATFORM_NAME } from "@/lib/constants";

// Inline styles throughout: email clients strip <style> blocks and external
// CSS unpredictably, so every rule that matters is inlined on the element.
const WRAPPER_STYLE =
  "font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px; color: #0f172a;";
const HEADING_STYLE = "font-size: 20px; font-weight: 600; margin: 0 0 8px;";
const MUTED_STYLE = "color: #64748b; font-size: 14px; line-height: 1.5;";
const BUTTON_STYLE =
  "display: inline-block; margin-top: 20px; padding: 10px 20px; background: #4338ca; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;";
const ITEM_ROW_STYLE = "padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px;";

export interface EmailOrderItem {
  name: string;
  quantity: number;
}

function itemsListHtml(items: EmailOrderItem[]): string {
  return items
    .map((item) => `<div style="${ITEM_ROW_STYLE}">${item.name} &times; ${item.quantity}</div>`)
    .join("");
}

export function orderConfirmationEmail(input: {
  customerName: string;
  orderNumber: string;
  storeName: string;
  items: EmailOrderItem[];
  total: number;
  currency: string;
  trackOrderUrl: string;
}): { subject: string; html: string } {
  const subject = `Your order ${input.orderNumber} from ${input.storeName} is confirmed`;
  const html = `
    <div style="${WRAPPER_STYLE}">
      <p style="${HEADING_STYLE}">Thanks, ${input.customerName}!</p>
      <p style="${MUTED_STYLE}">Your order from <strong>${input.storeName}</strong> has been paid and confirmed.</p>
      <p style="margin: 20px 0 4px; font-size: 14px; font-weight: 500;">Order ${input.orderNumber}</p>
      ${itemsListHtml(input.items)}
      <p style="margin-top: 12px; font-size: 16px; font-weight: 600;">Total: ${formatCurrency(input.total, input.currency)}</p>
      <a href="${input.trackOrderUrl}" style="${BUTTON_STYLE}">Track your order</a>
      <p style="${MUTED_STYLE} margin-top: 28px;">${PLATFORM_NAME}</p>
    </div>
  `;
  return { subject, html };
}

export function newOrderAlertEmail(input: {
  sellerName: string;
  orderNumber: string;
  storeName: string;
  customerName: string;
  items: EmailOrderItem[];
  total: number;
  currency: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  const subject = `New order ${input.orderNumber} on ${input.storeName}`;
  const html = `
    <div style="${WRAPPER_STYLE}">
      <p style="${HEADING_STYLE}">You've got a new order, ${input.sellerName}!</p>
      <p style="${MUTED_STYLE}">${input.customerName} just paid for an order on <strong>${input.storeName}</strong>.</p>
      <p style="margin: 20px 0 4px; font-size: 14px; font-weight: 500;">Order ${input.orderNumber}</p>
      ${itemsListHtml(input.items)}
      <p style="margin-top: 12px; font-size: 16px; font-weight: 600;">Total: ${formatCurrency(input.total, input.currency)}</p>
      <a href="${input.dashboardUrl}" style="${BUTTON_STYLE}">View order</a>
      <p style="${MUTED_STYLE} margin-top: 28px;">${PLATFORM_NAME}</p>
    </div>
  `;
  return { subject, html };
}
