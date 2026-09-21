import { RESERVED_SLUGS } from "@/lib/constants";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 63;
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export interface SlugValidationResult {
  valid: boolean;
  reason?: "format" | "reserved";
}

export function validateSlug(slug: string): SlugValidationResult {
  if (!isValidSlugFormat(slug)) return { valid: false, reason: "format" };
  if (isReservedSlug(slug)) return { valid: false, reason: "reserved" };
  return { valid: true };
}
