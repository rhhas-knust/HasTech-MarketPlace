"use client";

import { useActionState, useState, type ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldHint, FieldError } from "@/components/ui/input";
import type { Category, Product } from "@/lib/types/database";
import type { ProductFormState } from "@/app/dashboard/[slug]/products/actions";
import { cn } from "@/lib/cn";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", hint: "Only you can see it" },
  { value: "published", label: "Published", hint: "Visible on your store" },
  { value: "archived", label: "Archived", hint: "Hidden, kept for records" },
] as const;

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 sm:p-5">
      <h2 className="text-base font-semibold text-(--color-ink)">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-(--color-ink-muted)">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** A cedi amount field: decimal keyboard on phones and a visible GH₵ prefix. */
function MoneyInput(props: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-(--color-ink-muted)">
        GH₵
      </span>
      <Input type="number" inputMode="decimal" step="0.01" min="0" className="pl-12 tabular-nums" {...props} />
    </div>
  );
}

function Checkbox({
  id,
  label,
  hint,
  ...props
}: { id: string; label: string; hint?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex gap-3">
      <input id={id} name={id} type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-(--color-brand)" {...props} />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-(--color-ink)">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-sm text-(--color-ink-muted)">{hint}</p>}
      </div>
    </div>
  );
}

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
  const [isPreorder, setIsPreorder] = useState(product?.is_preorder ?? false);
  const [trackInventory, setTrackInventory] = useState(product?.track_inventory ?? true);
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [salePrice, setSalePrice] = useState(product?.sale_price != null ? String(product.sale_price) : "");

  // Mirrors the server rule (productSchema) so the seller sees it before saving.
  const saleTooHigh = salePrice !== "" && price !== "" && Number(salePrice) > Number(price);

  return (
    <form action={formAction} className="space-y-4">
      <Section title="Basic details">
        <div>
          <Label htmlFor="name">Product name</Label>
          <Input
            id="name"
            name="name"
            required
            minLength={2}
            maxLength={200}
            defaultValue={product?.name}
            placeholder="e.g. Kente stole, handwoven"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={5}
            maxLength={5000}
            defaultValue={product?.description ?? ""}
            placeholder="What it is, size or colour options, what's included."
          />
          <FieldHint>Customers read this before they buy. Short paragraphs work best on phones.</FieldHint>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="productType">Product type</Label>
            <Select id="productType" name="productType" defaultValue={product?.product_type ?? "physical"}>
              <option value="physical">Physical product</option>
              <option value="digital">Digital product (ebook, design file…)</option>
              <option value="service">Service</option>
            </Select>
            <FieldHint>Digital products and services skip delivery at checkout.</FieldHint>
          </div>
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
            {categories.length === 0 && <FieldHint>Create categories from the Categories page.</FieldHint>}
          </div>
        </div>
      </Section>

      <Section title="Pricing" description="Prices are in Ghana cedis.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="price">Price</Label>
            <MoneyInput
              id="price"
              name="price"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="salePrice">Sale price (optional)</Label>
            <MoneyInput
              id="salePrice"
              name="salePrice"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="0.00"
              aria-invalid={saleTooHigh || undefined}
              aria-describedby="salePrice-help"
            />
            <div id="salePrice-help">
              {saleTooHigh ? (
                <FieldError>Sale price must be lower than the regular price.</FieldError>
              ) : (
                <FieldHint>Shown with the regular price crossed out.</FieldHint>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Stock">
        <Checkbox
          id="trackInventory"
          label="Track stock for this product"
          hint="We'll stop selling it when it runs out and warn you when it's low."
          checked={trackInventory}
          onChange={(e) => setTrackInventory(e.target.checked)}
        />

        {/* Kept in the form when hidden so saving never resets the stored count. */}
        <div className={cn("grid gap-4 sm:grid-cols-2", !trackInventory && "hidden")}>
          <div>
            <Label htmlFor="stockQuantity">Quantity in stock</Label>
            <Input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              required={trackInventory}
              defaultValue={product?.stock_quantity ?? 0}
              className="tabular-nums"
            />
          </div>
          <div>
            <Label htmlFor="lowStockThreshold">Warn me when stock reaches (optional)</Label>
            <Input
              id="lowStockThreshold"
              name="lowStockThreshold"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              defaultValue={product?.low_stock_threshold ?? ""}
              className="tabular-nums"
            />
            <FieldHint>Leave blank to use your store&apos;s default.</FieldHint>
          </div>
        </div>

        <div className="rounded-lg bg-(--color-surface-subtle) p-3">
          <Checkbox
            id="isPreorder"
            label="Accept pre-orders"
            hint={
              <>
                Customers can order even at 0 stock. The button on your store reads &ldquo;Pre-order&rdquo;.
              </>
            }
            defaultChecked={product?.is_preorder ?? false}
            onChange={(e) => setIsPreorder(e.target.checked)}
          />
          {isPreorder && (
            <div className="mt-3 sm:pl-7">
              <Label htmlFor="preorderNote">Pre-order note (optional)</Label>
              <Input
                id="preorderNote"
                name="preorderNote"
                placeholder="e.g. Ships in 2–3 weeks"
                defaultValue={product?.preorder_note ?? ""}
                maxLength={280}
              />
            </div>
          )}
        </div>
      </Section>

      <Section title="Visibility and extras">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-(--color-ink)">Status</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer gap-3 rounded-lg border border-(--color-border) p-3 transition-colors has-checked:border-(--color-brand) has-checked:bg-(--color-brand-subtle) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--color-brand)"
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  defaultChecked={(product?.status ?? "draft") === option.value}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-(--color-brand)"
                />
                <span>
                  <span className="block text-sm font-medium text-(--color-ink)">{option.label}</span>
                  <span className="block text-xs text-(--color-ink-muted)">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Checkbox
          id="featured"
          label="Feature on your store's home page"
          defaultChecked={product?.featured ?? false}
        />

        <div className="sm:max-w-xs">
          <Label htmlFor="sku">SKU (optional)</Label>
          <Input id="sku" name="sku" maxLength={64} defaultValue={product?.sku ?? ""} />
          <FieldHint>Your own stock code, if you use one.</FieldHint>
        </div>
      </Section>

      {/* Stays reachable on long forms; sits above the phone navigation bar. */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-1 rounded-xl border border-(--color-border) bg-(--color-surface) p-3 shadow-raised lg:bottom-4">
        <div aria-live="polite">
          {state.error && (
            <p role="alert" className="mb-3 rounded-md bg-(--color-danger-subtle) px-3 py-2 text-sm text-(--color-danger)">
              {state.error}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {state.savedAt && !state.error && !pending && (
            <p key={state.savedAt} className="mr-auto flex items-center gap-1.5 text-sm text-(--color-success)">
              <CircleCheck className="h-4 w-4" aria-hidden /> Changes saved
            </p>
          )}
          <Button type="submit" disabled={pending || saleTooHigh} className="w-full sm:w-auto">
            {pending ? "Saving…" : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
