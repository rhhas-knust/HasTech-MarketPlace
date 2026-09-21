-- ============================================================================
-- Customers, carts and orders. Guest checkout is a first-class path: a
-- `customers` row can exist with user_id = null.
-- ============================================================================

create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  user_id uuid references profiles (id) on delete set null,
  email text,
  phone text,
  first_name text,
  last_name text,
  whatsapp_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_identity check (email is not null or phone is not null)
);

create unique index customers_store_email_idx
  on customers (store_id, lower(email))
  where email is not null;

create index customers_store_id_idx on customers (store_id);
create index customers_user_id_idx on customers (user_id);

create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  label text,
  address_line text not null,
  city text,
  region text,
  country text not null default 'Ghana',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index customer_addresses_customer_id_idx on customer_addresses (customer_id);

-- Carts are mutated exclusively through server-side code (see
-- src/lib/cart.ts): guests are identified by a signed cart id stored in an
-- httpOnly cookie, not by a client-supplied session_id RLS can trust. See
-- 0010_rls_policies.sql for why these tables carry no anon/authenticated
-- policies.
create table carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  customer_id uuid references customers (id) on delete set null,
  status cart_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index carts_store_id_idx on carts (store_id, status);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create index cart_items_cart_id_idx on cart_items (cart_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  customer_id uuid not null references customers (id) on delete restrict,
  order_number text not null unique,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  total numeric(10, 2) not null check (total >= 0),
  currency text not null default 'GHS',
  payment_status payment_status not null default 'pending',
  fulfilment_status fulfilment_status not null default 'pending',
  payment_reference text,
  delivery_method delivery_method not null default 'delivery',
  delivery_address_id uuid references customer_addresses (id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_matches_components
    check (total = subtotal + delivery_fee - discount)
);

create index orders_store_id_idx on orders (store_id, created_at desc);
create index orders_customer_id_idx on orders (customer_id);
create index orders_payment_status_idx on orders (store_id, payment_status);
create unique index orders_payment_reference_idx
  on orders (payment_reference)
  where payment_reference is not null;

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  constraint order_items_line_total_matches
    check (line_total = unit_price * quantity)
);

create index order_items_order_id_idx on order_items (order_id);
create index order_items_product_id_idx on order_items (product_id);
