-- ============================================================================
-- Catalogue: categories, products, images, variants, inventory movements.
-- Deliberately generic (no "book"/"sash" fields) so any business type can
-- use the same tables.
-- ============================================================================

create table categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  parent_id uuid references categories (id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create index categories_store_id_idx on categories (store_id);

create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  product_type product_type not null default 'physical',
  name text not null,
  slug text not null,
  description text,
  sku text,
  price numeric(10, 2) not null check (price >= 0),
  sale_price numeric(10, 2) check (sale_price is null or sale_price >= 0),
  currency text not null default 'GHS',
  track_inventory boolean not null default true,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer check (low_stock_threshold >= 0),
  status product_status not null default 'draft',
  featured boolean not null default false,
  -- Denormalised counters for fast dashboard reads. Source of truth is the
  -- analytics_events / product_views / order_items tables; these are
  -- maintained by triggers/functions (see 0009_functions_triggers.sql) and
  -- must never be written to directly by client code.
  view_count bigint not null default 0,
  add_to_cart_count bigint not null default 0,
  purchase_count bigint not null default 0,
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug),
  constraint products_sale_price_below_price
    check (sale_price is null or sale_price <= price)
);

create index products_store_id_idx on products (store_id);
create index products_store_status_idx on products (store_id, status);
create index products_category_id_idx on products (category_id);
create index products_featured_idx on products (store_id, featured) where featured = true;

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  storage_path text not null,
  url text not null,
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on product_images (product_id);

-- Lightweight variant model (e.g. size/colour) for future use. V1 ships no
-- dedicated UI for this, but the schema does not block adding one.
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  name text not null,
  value text not null,
  price_override numeric(10, 2) check (price_override is null or price_override >= 0),
  sku_override text,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  created_at timestamptz not null default now()
);

create index product_variants_product_id_idx on product_variants (product_id);

-- Audit trail for every stock change (sale, restock, manual correction,
-- order cancellation). This is what "inventory" means in this schema --
-- products.stock_quantity is the current balance, this table is the ledger.
create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  change_qty integer not null,
  reason text not null check (reason in ('sale', 'restock', 'manual_adjustment', 'order_cancelled')),
  reference_id uuid,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index inventory_movements_store_id_idx on inventory_movements (store_id, created_at desc);
create index inventory_movements_product_id_idx on inventory_movements (product_id);
