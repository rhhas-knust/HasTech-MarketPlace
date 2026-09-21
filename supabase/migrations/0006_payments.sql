-- ============================================================================
-- Payments. `payments` is the authoritative local record of a transaction;
-- `payment_events` is the raw webhook/verification log used for idempotency.
-- Client code never writes to either table -- only server code (checkout
-- initialisation, webhook handler) using the service-role key does.
-- ============================================================================

create table payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null default 'paystack',
  reference text not null unique,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'GHS',
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'abandoned')),
  channel text,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_store_id_idx on payments (store_id, created_at desc);
create index payments_order_id_idx on payments (order_id);

-- Idempotency ledger for webhook processing. A given (provider, reference,
-- event_type) is only ever acted on once: the webhook handler attempts an
-- insert here inside the same transaction as any order/payment mutation,
-- and a unique-violation means "already processed, no-op".
create table payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references payments (id) on delete set null,
  provider text not null,
  event_type text not null,
  reference text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, reference, event_type)
);

create index payment_events_payment_id_idx on payment_events (payment_id);
