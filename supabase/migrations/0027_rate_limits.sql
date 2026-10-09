-- Rate limiting for the public, no-login forms (contact, checkout, order
-- lookup). Each attempt is one row; the function records the attempt and
-- says whether the caller is over the limit in one round trip.
--
-- key_hash is a SHA-256 of the caller's IP (hashed in the app), never the
-- IP itself. Rows only matter for the length of a window; purge_expired_data()
-- (0025_retention_job.sql) deletes anything older than a day.

create table if not exists public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_lookup_idx
  on public.rate_limit_hits (bucket, key_hash, created_at desc);

alter table public.rate_limit_hits enable row level security;
-- No policies: only the service role (which bypasses RLS) reads or writes.

create or replace function public.hit_rate_limit(
  p_bucket text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  recent integer;
begin
  insert into public.rate_limit_hits (bucket, key_hash) values (p_bucket, p_key_hash);
  select count(*) into recent
    from public.rate_limit_hits
   where bucket = p_bucket
     and key_hash = p_key_hash
     and created_at > now() - make_interval(secs => p_window_seconds);
  return recent <= p_limit;
end;
$$;

revoke execute on function public.hit_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, text, integer, integer) to service_role;
