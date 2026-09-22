-- ============================================================================
-- Platform billing: how HASTECH itself gets paid, as opposed to
-- store_payment_credentials (each SELLER's own Paystack keys for their
-- customer-facing checkout). Sellers choose one of two plans:
--   * commission  -- 5% of each order accrues in platform_commission_ledger
--                    and is settled in batches against HASTECH's own
--                    Paystack account (src/lib/payments/platform.ts).
--   * subscription -- a flat monthly fee, paid the same way.
-- The first five stores ever created are "founding members": every fee is
-- waived until the end of the calendar month they joined in.
-- ============================================================================

create table platform_billing (
  store_id uuid primary key references stores (id) on delete cascade,
  billing_plan text not null default 'commission' check (billing_plan in ('commission', 'subscription')),
  commission_rate numeric(5, 2) not null default 5.00,
  subscription_price numeric(10, 2) not null default 100.00,
  subscription_status text not null default 'inactive' check (subscription_status in ('inactive', 'active', 'past_due')),
  subscription_current_period_end timestamptz,
  is_founding_member boolean not null default false,
  founding_member_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table platform_billing_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  kind text not null check (kind in ('subscription', 'commission_settlement')),
  reference text not null unique,
  amount numeric(10, 2) not null,
  currency text not null default 'GHS',
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  period_start timestamptz,
  period_end timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

-- One row per paid order on a commission-plan store. `waived` covers
-- founding-member/free-promo orders (kept for a transparent history rather
-- than simply not writing a row); `settled` flips true once the seller pays
-- off a batch of accrued commission via platform_billing_payments.
create table platform_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  order_id uuid not null unique references orders (id) on delete cascade,
  order_total numeric(10, 2) not null,
  commission_rate numeric(5, 2) not null,
  commission_amount numeric(10, 2) not null,
  waived boolean not null default false,
  settled boolean not null default false,
  settled_payment_id uuid references platform_billing_payments (id),
  created_at timestamptz not null default now()
);

create index platform_billing_payments_store_idx on platform_billing_payments (store_id, created_at desc);
create index platform_commission_ledger_store_idx on platform_commission_ledger (store_id, created_at desc);
create index platform_commission_ledger_unsettled_idx on platform_commission_ledger (store_id)
  where settled = false and waived = false;

create trigger set_updated_at before update on platform_billing for each row execute function set_updated_at();

alter table platform_billing enable row level security;
alter table platform_billing_payments enable row level security;
alter table platform_commission_ledger enable row level security;

-- Sellers can see their own plan/status and payment/ledger history; every
-- write is server-side via the service-role client (see
-- src/lib/payments/platform.ts and
-- src/app/dashboard/[slug]/settings/billing/actions.ts), so a seller can
-- never grant themselves founding-member status, discount their own
-- commission_rate, or mark a ledger entry settled from the browser.
create policy platform_billing_select on platform_billing for select to authenticated
  using (is_store_member(store_id));
create policy platform_billing_payments_select on platform_billing_payments for select to authenticated
  using (is_store_member(store_id));
create policy platform_commission_ledger_select on platform_commission_ledger for select to authenticated
  using (is_store_member(store_id));

-- Every new store gets a platform_billing row automatically. The first five
-- stores ever created become founding members with every fee waived through
-- the end of the calendar month they joined in. security definer so it can
-- read platform_billing regardless of who's running the insert; there's a
-- small race window under concurrent signups landing on slot 5, deemed
-- acceptable at this scale.
create function assign_platform_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_founding_count integer;
begin
  select count(*) into v_founding_count from platform_billing where is_founding_member = true;

  insert into platform_billing (store_id, is_founding_member, founding_member_until)
  values (
    new.id,
    v_founding_count < 5,
    case when v_founding_count < 5 then date_trunc('month', now()) + interval '1 month' else null end
  )
  on conflict (store_id) do nothing;

  return new;
end;
$$;

create trigger stores_after_insert_assign_billing
after insert on stores
for each row execute function assign_platform_billing();

-- Backfill stores created before this migration: oldest five become
-- founding members, everyone else gets a default (paid, commission-plan) row.
insert into platform_billing (store_id, is_founding_member, founding_member_until)
select id, true, date_trunc('month', now()) + interval '1 month'
from (
  select id, row_number() over (order by created_at asc) as rn
  from stores
) ranked
where rn <= 5
on conflict (store_id) do nothing;

insert into platform_billing (store_id)
select id from stores
on conflict (store_id) do nothing;
