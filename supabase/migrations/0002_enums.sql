-- Fixed vocabularies. Kept as enums (instead of free-text) so invalid states
-- are rejected by the database, not just the application layer. New values
-- can be appended later with `alter type ... add value`.

create type business_type as enum (
  'retail',
  'service',
  'digital_product',
  'restaurant',
  'professional_service',
  'creator',
  'organisation',
  'other'
);

create type store_status as enum ('active', 'suspended', 'archived');

create type store_member_role as enum ('owner', 'staff');

create type product_type as enum ('physical', 'service', 'digital');

create type product_status as enum ('draft', 'published', 'archived');

-- Fulfilment/order status and payment status are intentionally separate
-- (see spec: "these must be separate") so an order can be `paid` while still
-- `processing`, or `cancelled` after being `paid` (triggering a refund flow).
create type fulfilment_status as enum (
  'pending',
  'confirmed',
  'processing',
  'ready',
  'completed',
  'cancelled',
  'refunded'
);

create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create type delivery_method as enum ('delivery', 'pickup');

create type cart_status as enum ('active', 'converted', 'abandoned');
