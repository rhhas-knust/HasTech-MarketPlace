"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { CategoryFormState } from "@/app/dashboard/[slug]/categories/actions";

export function CategoryForm({
  action,
}: {
  action: (state: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
}) {
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(action, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[180px]">
        <Label htmlFor="name">Category name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex-1 min-w-[180px]">
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" name="description" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add category"}
      </Button>
      {state.error && <p className="w-full text-sm text-(--color-danger)">{state.error}</p>}
    </form>
  );
}
