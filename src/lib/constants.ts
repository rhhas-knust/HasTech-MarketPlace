import type { BusinessType } from "@/lib/types/database";

export const DEFAULT_CURRENCY = "GHS";
export const DEFAULT_COUNTRY = "Ghana";
export const DEFAULT_TIMEZONE = "Africa/Accra";

export const PLATFORM_NAME = "HASTECH Commerce";

export const BUSINESS_TYPE_OPTIONS: {
  value: BusinessType;
  label: string;
  ctaLabel: string;
  description: string;
}[] = [
  {
    value: "retail",
    label: "Retail / Products",
    ctaLabel: "Add to Cart",
    description: "Physical products you ship or hand over: books, clothes, shoes, electronics.",
  },
  {
    value: "service",
    label: "Service Provider",
    ctaLabel: "Book Service",
    description: "Salons, barbers, mechanics, repairs, photographers.",
  },
  {
    value: "digital_product",
    label: "Digital Products",
    ctaLabel: "Buy & Download",
    description: "E-books, courses, templates and other downloads.",
  },
  {
    value: "restaurant",
    label: "Food & Restaurant",
    ctaLabel: "Order Now",
    description: "Food businesses taking orders for pickup or delivery.",
  },
  {
    value: "professional_service",
    label: "Professional Services",
    ctaLabel: "Request Service",
    description: "Consultants, freelancers, tutors, agencies.",
  },
  {
    value: "creator",
    label: "Creator",
    ctaLabel: "Buy Now",
    description: "Independent creators selling work directly.",
  },
  {
    value: "organisation",
    label: "Organisation",
    ctaLabel: "Get In Touch",
    description: "Churches, schools, non-profits and other organisations.",
  },
  {
    value: "other",
    label: "Other",
    ctaLabel: "Buy Now",
    description: "Doesn't fit the categories above.",
  },
];

export function ctaLabelForBusinessType(businessType: BusinessType): string {
  return (
    BUSINESS_TYPE_OPTIONS.find((o) => o.value === businessType)?.ctaLabel ?? "Add to Cart"
  );
}

export const FULFILMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

// Slugs that would otherwise collide with platform routes or be confusing/
// impersonation-prone as a store URL. Enforced in application code (see
// src/lib/slug.ts) rather than a database table -- it's a static list that
// only needs to be checked at store-creation time.
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "blog",
  "cart",
  "checkout",
  "dashboard",
  "docs",
  "favicon.ico",
  "help",
  "hastech",
  "login",
  "logout",
  "onboarding",
  "order",
  "platform",
  "pricing",
  "privacy",
  "product",
  "robots.txt",
  "settings",
  "signup",
  "sitemap.xml",
  "static",
  "store",
  "support",
  "terms",
  "www",
]);

// Guest visitor / cart cookies are scoped per store so a shopper can browse
// multiple stores in one browser without carts colliding.
export function cartCookieName(storeSlug: string) {
  return `hastech_cart_${storeSlug}`;
}

export const VISITOR_ID_COOKIE = "hastech_visitor_id";
