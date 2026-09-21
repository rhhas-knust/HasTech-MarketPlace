-- ============================================================================
-- Generic analytics event stream + a dedicated, deduplicated product-views
-- table (views are the highest-volume, highest-value event so they get
-- their own table rather than living only inside metadata jsonb).
--
-- Rows in both tables are only ever inserted through the SECURITY DEFINER
-- functions in 0009_functions_triggers.sql (record_product_view,
-- record_analytics_event). Client code, including anonymous storefront
-- visitors, never gets a direct INSERT grant on these tables -- that would
-- let anyone spoof arbitrary store_id/product_id combinations or write
-- unbounded metadata. The functions validate the product/store relationship
-- and apply the view-dedupe window before writing.
-- ============================================================================

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  event_type text not null check (event_type in (
    'page_view', 'product_view', 'search', 'add_to_cart', 'remove_from_cart',
    'checkout_started', 'payment_started', 'payment_success', 'payment_failed',
    'purchase'
  )),
  product_id uuid references products (id) on delete set null,
  order_id uuid references orders (id) on delete set null,
  session_id text,
  visitor_id text,
  metadata jsonb not null default '{}'::jsonb,
  source text,
  device_type text,
  country text,
  created_at timestamptz not null default now()
);

create index analytics_events_store_type_time_idx
  on analytics_events (store_id, event_type, created_at desc);
create index analytics_events_store_product_time_idx
  on analytics_events (store_id, product_id, created_at desc)
  where product_id is not null;

-- Anonymous, privacy-conscious visitor identifiers only (no PII). See
-- src/lib/analytics/track.ts for how visitor_id/session_id are generated.
create table product_views (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  session_id text,
  visitor_id text not null,
  source text,
  device_type text,
  country text,
  created_at timestamptz not null default now()
);

create index product_views_store_product_time_idx
  on product_views (store_id, product_id, created_at desc);
create index product_views_dedupe_idx
  on product_views (product_id, visitor_id, created_at desc);
