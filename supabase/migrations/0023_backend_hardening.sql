-- ============================================================================
-- Backend hardening after a Supabase advisor review (2026-10-09).
-- ============================================================================

-- 1. Analytics RPCs are server-only now.
--    record_product_view / record_analytics_event were executable with the
--    public anon key, so anyone could call /rest/v1/rpc/... directly and
--    inflate a store's view counts. The app now calls them with the service
--    role from server code (src/lib/analytics/track.ts), so revoke the rest.
revoke execute on function record_product_view(uuid, uuid, text, text, text, text, text, interval)
  from public, anon, authenticated;
revoke execute on function record_analytics_event(uuid, text, uuid, uuid, text, text, jsonb, text, text, text)
  from public, anon, authenticated;
grant execute on function record_product_view(uuid, uuid, text, text, text, text, text, interval) to service_role;
grant execute on function record_analytics_event(uuid, text, uuid, uuid, text, text, jsonb, text, text, text) to service_role;

-- 2. assign_platform_billing() is a trigger function. Triggers don't check
--    the caller's EXECUTE privilege, so nobody needs it through the API.
revoke execute on function assign_platform_billing() from public, anon, authenticated;

-- (is_store_member / is_store_owner / is_platform_admin stay executable:
--  RLS policies call them as the requesting role, and they only answer
--  yes/no about the caller themselves.)

-- 3. Cover the two foreign keys the advisor flagged.
create index if not exists platform_commission_ledger_settled_payment_idx
  on platform_commission_ledger (settled_payment_id)
  where settled_payment_id is not null;
create index if not exists platform_feedback_store_id_idx on platform_feedback (store_id);

-- 4. Retention promised in the Privacy Policy (/privacy, "How long we keep it").
--    Contact messages: 12 months after the conversation is closed. Track when
--    that happened, since status alone doesn't say.
alter table consultation_requests add column if not exists closed_at timestamptz;

create or replace function set_consultation_closed_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'closed' and (old.status is distinct from 'closed') then
    new.closed_at := now();
  elsif new.status <> 'closed' then
    new.closed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists consultation_requests_closed_at on consultation_requests;
create trigger consultation_requests_closed_at
  before update of status on consultation_requests
  for each row execute function set_consultation_closed_at();

-- Already-closed rows: start their clock now rather than deleting early.
update consultation_requests set closed_at = now() where status = 'closed' and closed_at is null;

create or replace function purge_expired_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n_consultations int;
  n_events int;
  n_views int;
  n_carts int;
begin
  delete from consultation_requests
    where status = 'closed' and closed_at < now() - interval '12 months';
  get diagnostics n_consultations = row_count;

  delete from analytics_events where created_at < now() - interval '24 months';
  get diagnostics n_events = row_count;

  delete from product_views where created_at < now() - interval '24 months';
  get diagnostics n_views = row_count;

  -- Carts that never became orders. The cart cookie lasts 30 days, so after
  -- 60 days without activity nobody can return to them.
  delete from carts where status <> 'converted' and updated_at < now() - interval '60 days';
  get diagnostics n_carts = row_count;

  return jsonb_build_object(
    'consultations', n_consultations,
    'analytics_events', n_events,
    'product_views', n_views,
    'carts', n_carts
  );
end;
$$;

revoke execute on function purge_expired_data() from public, anon, authenticated;

-- 5. Run it nightly at 03:15 Accra time (UTC+0).
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'purge-expired-data';
select cron.schedule('purge-expired-data', '15 3 * * *', $$select public.purge_expired_data()$$);
