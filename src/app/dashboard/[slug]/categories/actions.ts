"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStoreAccess } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validation/product";
import { slugify } from "@/lib/slug";

export interface CategoryFormState {
  error?: string;
}

export async function createCategoryAction(
  storeSlug: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return { error: "Not authorized" };

  const parsed = categorySchema.safeParse({ name: formData.get("name"), description: formData.get("description") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    store_id: membership.store.id,
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description || null,
  });
  if (error) return { error: error.code === "23505" ? "A category with that name already exists." : "Could not create category." };

  revalidatePath(`/dashboard/${storeSlug}/categories`);
  return {};
}

export async function deleteCategoryAction(storeSlug: string, categoryId: string): Promise<void> {
  const membership = await requireStoreAccess(storeSlug);
  if (!membership) return;

  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", categoryId).eq("store_id", membership.store.id);
  revalidatePath(`/dashboard/${storeSlug}/categories`);
}
