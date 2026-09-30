import { describe, expect, it } from "vitest";
import { orderConfirmationEmail, newOrderAlertEmail } from "@/lib/email-templates";

const items = [{ name: "Graduation sash", quantity: 2 }];

describe("orderConfirmationEmail", () => {
  it("includes the order number, items and total in the subject and body", () => {
    const { subject, html } = orderConfirmationEmail({
      customerName: "Ama",
      orderNumber: "AB-1000",
      storeName: "Amara Books",
      items,
      total: 90,
      currency: "GHS",
      trackOrderUrl: "https://example.com/track",
    });

    expect(subject).toContain("AB-1000");
    expect(subject).toContain("Amara Books");
    expect(html).toContain("Ama");
    expect(html).toContain("Graduation sash");
    expect(html).toContain("90.00");
    expect(html).toContain("https://example.com/track");
  });
});

describe("newOrderAlertEmail", () => {
  it("includes the seller, customer and order details", () => {
    const { subject, html } = newOrderAlertEmail({
      sellerName: "Amara",
      orderNumber: "AB-1000",
      storeName: "Amara Books",
      customerName: "Kofi Mensah",
      items,
      total: 90,
      currency: "GHS",
      dashboardUrl: "https://example.com/dashboard",
    });

    expect(subject).toContain("AB-1000");
    expect(html).toContain("Amara");
    expect(html).toContain("Kofi Mensah");
    expect(html).toContain("90.00");
    expect(html).toContain("https://example.com/dashboard");
  });
});
