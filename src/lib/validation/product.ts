import { z } from "zod";

export const productSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    description: z.string().trim().max(5000).optional().or(z.literal("")),
    categoryId: z.string().uuid().nullable().optional(),
    sku: z.string().trim().max(64).optional().or(z.literal("")),
    price: z.number().min(0),
    salePrice: z.number().min(0).nullable().optional(),
    trackInventory: z.boolean(),
    stockQuantity: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).nullable().optional(),
    status: z.enum(["draft", "published", "archived"]),
    featured: z.boolean(),
    isPreorder: z.boolean(),
    preorderNote: z.string().trim().max(280).optional().or(z.literal("")),
  })
  .refine((data) => data.salePrice == null || data.salePrice <= data.price, {
    message: "Sale price must not be higher than the regular price",
    path: ["salePrice"],
  });

export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  parentId: z.string().uuid().nullable().optional(),
});
