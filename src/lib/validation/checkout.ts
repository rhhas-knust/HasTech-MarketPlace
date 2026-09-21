import { z } from "zod";

export const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(9, "Enter a valid phone number").max(20),
  deliveryMethod: z.enum(["delivery", "pickup"]),
  addressLine: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.deliveryMethod === "delivery" && !data.addressLine) {
    ctx.addIssue({
      code: "custom",
      path: ["addressLine"],
      message: "Delivery address is required for delivery orders",
    });
  }
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
