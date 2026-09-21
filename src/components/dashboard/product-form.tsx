"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldHint } from "@/components/ui/input";
import type { Category, Product } from "@/lib/types/database";
import type { ProductFormState } from "@/app/dashboard/[slug]/products/actions";

export function ProductForm({
  action,
  categories,
  product,
  submitLabel,
}: {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  categories: Category[];
  product?: Product;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="name">Product name</Label>
        <Input id="name" name="name" required defaultValue={product?.name} />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={product?.description ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" name="categoryId" defaultValue={product?.category_id ?? ""}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sku">SKU (optional)</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" type="number" step="0.01" min="0" required defaultValue={product?.price} />
        </div>
        <div>
          <Label htmlFor="salePrice">Sale price (optional)</Label>
          <Input id="salePrice" name="salePrice" type="number" step="0.01" min="0" defaultValue={product?.sale_price ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="stockQuantity">Stock quantity</Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            required
            defaultValue={product?.stock_quantity ?? 0}
          />
        </div>
        <div>
          <Label htmlFor="lowStockThreshold">Low stock alert at (optional)</Label>
          <Input
            id="lowStockThreshold"
            name="lowStockThreshold"
            type="number"
            min="0"
            defaultValue={product?.low_stock_threshold ?? ""}
          />
          <FieldHint>Leave blank to use your store&apos;s default threshold.</FieldHint>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="trackInventory"
          name="trackInventory"
          type="checkbox"
          defaultChecked={product?.track_inventory ?? true}
        />
        <Label htmlFor="trackInventory" className="mb-0">
          Track stock for this product
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <input id="featured" name="featured" type="checkbox" defaultChecked={product?.featured ?? false} />
        <Label htmlFor="featured" className="mb-0">
          Feature on storefront homepage
        </Label>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue={product?.status ?? "draft"}>
          <option value="draft">Draft (not visible to customers)</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
