// Hand-written types mirroring supabase/migrations/*.sql. If this project is
// connected to a real Supabase project, these can be regenerated with
// `supabase gen types typescript` -- keep the shape in sync either way.

export type BusinessType =
  | "retail"
  | "service"
  | "digital_product"
  | "restaurant"
  | "professional_service"
  | "creator"
  | "organisation"
  | "other";

export type StoreStatus = "active" | "suspended" | "archived";
export type StoreMemberRole = "owner" | "staff";
export type ProductType = "physical" | "service" | "digital";
export type ProductStatus = "draft" | "published" | "archived";
export type FulfilmentStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "completed"
  | "cancelled"
  | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type DeliveryMethod = "delivery" | "pickup";
export type CartStatus = "active" | "converted" | "abandoned";
export type AnalyticsEventType =
  | "page_view"
  | "product_view"
  | "search"
  | "add_to_cart"
  | "remove_from_cart"
  | "checkout_started"
  | "payment_started"
  | "payment_success"
  | "payment_failed"
  | "purchase";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  business_type: BusinessType;
  status: StoreStatus;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string;
  currency: string;
  timezone: string;
  theme: Record<string, unknown>;
  social_links: Record<string, string>;
  onboarding_step: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreMember {
  id: string;
  store_id: string;
  user_id: string;
  role: StoreMemberRole;
  created_at: string;
}

export interface StoreSettings {
  store_id: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_fee: number;
  free_delivery_threshold: number | null;
  delivery_notes: string | null;
  low_stock_threshold: number;
  order_number_prefix: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  product_type: ProductType;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  price: number;
  sale_price: number | null;
  currency: string;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number | null;
  status: ProductStatus;
  featured: boolean;
  view_count: number;
  add_to_cart_count: number;
  purchase_count: number;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  value: string;
  price_override: number | null;
  sku_override: string | null;
  stock_quantity: number | null;
  created_at: string;
}

export interface Customer {
  id: string;
  store_id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  whatsapp_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string | null;
  address_line: string;
  city: string | null;
  region: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface Cart {
  id: string;
  store_id: string;
  customer_id: string | null;
  status: CartStatus;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  customer_id: string;
  order_number: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  currency: string;
  payment_status: PaymentStatus;
  fulfilment_status: FulfilmentStatus;
  payment_reference: string | null;
  delivery_method: DeliveryMethod;
  delivery_address_id: string | null;
  notes: string | null;
  stock_decremented: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface Payment {
  id: string;
  store_id: string;
  order_id: string;
  provider: string;
  reference: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "abandoned";
  channel: string | null;
  raw_response: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  store_id: string;
  event_type: AnalyticsEventType;
  product_id: string | null;
  order_id: string | null;
  session_id: string | null;
  visitor_id: string | null;
  metadata: Record<string, unknown>;
  source: string | null;
  device_type: string | null;
  country: string | null;
  created_at: string;
}
