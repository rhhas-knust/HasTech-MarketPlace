import { z } from "zod";

export const consultationSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  businessName: z.string().trim().max(200).optional().or(z.literal("")),
  topic: z.enum(["how_it_works", "pricing", "privacy", "other"]),
  message: z.string().trim().min(10, "Tell us a bit more (at least 10 characters)").max(4000),
});

export type ConsultationInput = z.infer<typeof consultationSchema>;
