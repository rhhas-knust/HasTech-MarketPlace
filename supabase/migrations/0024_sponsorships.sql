-- ============================================================================
-- Sponsored placements: a seller pays HASTECH for a few weeks of being shown
-- on OTHER stores (one slim "Sponsored" row on storefronts, and a category
-- strip on the payment-success page).
--
-- Payments go to HASTECH's own Paystack account, same as platform fees, but
-- live in their own table: one row per purchase, holding its reference,
-- amount and the window it pays for.
-- ============================================================================

create table sponsorships (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'failed', 'cancelled')),
  weeks integer not null check (weeks between 1 and 12),
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'GHS',
  reference text not null unique,
  starts_at timestamptz,
  ends_at timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  constraint sponsorships_window check (
    (status <> 'active') or (starts_at is not null and ends_at is not null and ends_at > starts_at)
  )
);

create index sponsorships_store_idx on sponsorships (store_id, created_at desc);
create index sponsorships_live_idx on sponsorships (ends_at) where status = 'active';

-- Insert-only log of views and clicks, so counts can't be rewritten and no
-- personal data is involved: no visitor id, IP or user agent.
create table sponsor_events (
  id bigint generated always as identity primary key,
  sponsorship_id uuid not null references sponsorships (id) on delete cascade,
  kind text not null check (kind in ('impression', 'click')),
  placement text not null check (placement in ('storefront', 'checkout_success')),
  host_store_id uuid references stores (id) on delete set null,
  created_at timestamptz not null default now()
);

create index sponsor_events_sponsorship_idx on sponsor_events (sponsorship_id, kind);
create index sponsor_events_host_store_idx on sponsor_events (host_store_id) where host_store_id is not null;

-- Sellers can switch the sponsored row off on their own store.
alter table stores add column if not exists show_sponsored boolean not null default true;

-- Access: sellers read their own purchases and stats; every write goes
-- through server code with the service role (payments must be verified with
-- Paystack first, and events are recorded by the server, not the browser).
alter table sponsorships enable row level security;
alter table sponsor_events enable row level security;

create policy sponsorships_member_select on sponsorships
  for select to authenticated
  using (is_store_member(store_id));

create policy sponsor_events_member_select on sponsor_events
  for select to authenticated
  using (exists (
    select 1 from sponsorships s
    where s.id = sponsor_events.sponsorship_id and is_store_member(s.store_id)
  ));

grant select on sponsorships, sponsor_events to authenticated;
grant all on sponsorships, sponsor_events to service_role;
grant usage on sequence sponsor_events_id_seq to service_role;
