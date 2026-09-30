-- ============================================================================
-- Two independent changes:
--
-- 1. Raise the founding-member (fully fee-waived) slot count from 5 to 10.
--    create or replace on the existing trigger function -- never edit an
--    already-applied migration -- so future signups (the platform currently
--    has 4 founding members) get the new threshold.
--
-- 2. Consultation requests: a public "talk to us" form for prospective
--    sellers to ask about how the platform works, pricing, etc, before they
--    sign up. No login involved, so -- like guest checkout -- writes go
--    through the service-role client from a validated server action rather
--    than a public INSERT policy. Only platform admins can read them.
-- ============================================================================

create or replace function assign_platform_billing()
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
    v_founding_count < 10,
    case when v_founding_count < 10 then date_trunc('month', now()) + interval '1 month' else null end
  )
  on conflict (store_id) do nothing;

  return new;
end;
$$;

create table consultation_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  business_name text,
  topic text not null default 'other' check (topic in ('how_it_works', 'pricing', 'other')),
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  constraint consultation_requests_message_length check (char_length(message) between 1 and 4000)
);

create index consultation_requests_status_idx on consultation_requests (status, created_at desc);

alter table consultation_requests enable row level security;

-- No insert/update policy for anon/authenticated at all: the public form
-- submits through submitConsultationRequest (service-role client, see
-- src/lib/consultations.ts) so it can apply its own validation and a
-- honeypot check before anything is written. Only admins can read or
-- triage the list.
create policy consultation_requests_admin_select on consultation_requests for select to authenticated
  using (is_platform_admin());
create policy consultation_requests_admin_update on consultation_requests for update to authenticated
  using (is_platform_admin()) with check (is_platform_admin());
