-- ============================================================================
-- Platform-level identity and the tenant (store) model.
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'One row per auth.users row. Never store secrets here.';

-- Platform administrators (HASTECH staff). Deliberately not self-service:
-- only writable via the service role (e.g. a one-off SQL statement run by an
-- operator), never via a client-facing policy.
create table platform_admins (
  user_id uuid primary key references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- The tenant. Every seller/business is one row here.
create table stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete restrict,
  name text not null,
  slug text not null unique,
  business_type business_type not null default 'retail',
  status store_status not null default 'active',
  description text,
  logo_url text,
  cover_image_url text,
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  address text,
  city text,
  region text,
  country text not null default 'Ghana',
  currency text not null default 'GHS',
  timezone text not null default 'Africa/Accra',
  -- Free-form, genuinely-variable presentation config (hero copy, colours,
  -- social links). Deliberately jsonb: it is display configuration, not
  -- relational business data, and its shape will keep growing per business
  -- type. Everything that is queried, filtered or joined on lives in a real
  -- column instead.
  theme jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  onboarding_step text not null default 'business_info',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint stores_slug_length check (char_length(slug) between 3 and 63)
);

create index stores_owner_id_idx on stores (owner_id);
create index stores_status_idx on stores (status) where status = 'active';

create table store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role store_member_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create index store_members_user_id_idx on store_members (user_id);

-- Structured, per-store operational settings. Split from `stores` so the
-- (larger, more sensitive) settings surface can evolve and be governed by
-- its own RLS without touching the storefront-facing `stores` row.
create table store_settings (
  store_id uuid primary key references stores (id) on delete cascade,
  delivery_enabled boolean not null default true,
  pickup_enabled boolean not null default true,
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  free_delivery_threshold numeric(10, 2) check (free_delivery_threshold >= 0),
  delivery_notes text,
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  order_number_prefix text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Paystack (or future provider) credentials. Intentionally isolated in its
-- own table with NO client-facing RLS policies at all (see 0010_rls.sql) --
-- only the service-role key used by trusted server code can ever read or
-- write it. The dashboard settings page only ever renders whether a key is
-- configured, never the key itself.
create table store_payment_credentials (
  store_id uuid primary key references stores (id) on delete cascade,
  provider text not null default 'paystack',
  public_key text,
  secret_key text,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-provision a profile row whenever a new auth user signs up.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Whenever a store is created, its owner automatically becomes a
-- store_members row with role 'owner', and a default settings row is
-- created. Keeps callers from having to do this in two extra client calls
-- (and two extra RLS policies) after creating the store.
create function handle_new_store()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.store_members (store_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  insert into public.store_settings (store_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_store_created
  after insert on stores
  for each row execute function handle_new_store();
