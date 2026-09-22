import { z } from "zod";
import { isValidSlugFormat, isReservedSlug } from "@/lib/slug";

const businessTypeValues = [
  "retail",
  "service",
  "digital_product",
  "restaurant",
  "professional_service",
  "creator",
  "organisation",
  "other",
] as const;

export const storeBusinessInfoSchema = z.object({
  name: z.string().trim().min(2, "Business name is too short").max(120),
  businessType: z.enum(businessTypeValues),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const storeSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isValidSlugFormat, {
    message: "Use lowercase letters, numbers and hyphens only (3-63 characters)",
  })
  .refine((slug) => !isReservedSlug(slug), { message: "This URL is reserved, please pick another" });

export const storeContactSchema = z.object({
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().min(6).max(20).optional().or(z.literal("")),
  whatsappNumber: z.string().trim().min(6).max(20).optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  region: z.string().trim().max(120).optional().or(z.literal("")),
});

export const storeSettingsSchema = z.object({
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  deliveryFee: z.number().min(0),
  freeDeliveryThreshold: z.number().min(0).nullable(),
  deliveryNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  lowStockThreshold: z.number().int().min(0),
});

export const storeBrandingSchema = z.object({
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex colour, like #4338CA"),
});

export const paystackCredentialsSchema = z.object({
  publicKey: z.string().trim().min(10, "That doesn't look like a valid Paystack public key"),
  secretKey: z.string().trim().min(10, "That doesn't look like a valid Paystack secret key"),
});
