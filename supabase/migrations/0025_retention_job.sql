-- ============================================================================
-- Retention promised in the Privacy Policy (/privacy, "How long we keep it"),
-- enforced nightly with pg_cron.
--
-- Run this one from the Supabase SQL editor: the automated migration tool
-- refuses statements containing DELETE without an interactive confirmation.
-- ============================================================================

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
  n_sponsor_events int;
begin
  -- Contact messages: 12 months after the conversation was closed.
  delete from consultation_requests
    where status = 'closed' and closed_at < now() - interval '12 months';
  get diagnostics n_consultations = row_count;

  -- Analytics: 24 months.
  delete from analytics_events where created_at < now() - interval '24 months';
  get diagnostics n_events = row_count;

  delete from product_views where created_at < now() - interval '24 months';
  get diagnostics n_views = row_count;

  delete from sponsor_events where created_at < now() - interval '24 months';
  get diagnostics n_sponsor_events = row_count;

  -- Carts that never became orders. The cart cookie lasts 30 days, so after
  -- 60 days without activity nobody can return to them.
  delete from carts where status <> 'converted' and updated_at < now() - interval '60 days';
  get diagnostics n_carts = row_count;

  return jsonb_build_object(
    'consultations', n_consultations,
    'analytics_events', n_events,
    'product_views', n_views,
    'sponsor_events', n_sponsor_events,
    'carts', n_carts
  );
end;
$$;

revoke execute on function purge_expired_data() from public, anon, authenticated;

-- Nightly at 03:15 Accra time (UTC+0).
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'purge-expired-data';
select cron.schedule('purge-expired-data', '15 3 * * *', $$select public.purge_expired_data()$$);
