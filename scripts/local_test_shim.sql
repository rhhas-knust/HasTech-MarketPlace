-- Minimal stand-in for the parts of a Supabase project that our migrations
-- assume already exist (they are provisioned by Supabase itself, not by our
-- migrations): the `anon`/`authenticated`/`service_role` roles, the
-- `auth.users` table, and `auth.uid()`. This lets 0001-0010 run unmodified
-- against a plain local Postgres for RLS testing -- see scripts/test-rls.sh.
-- NEVER run this against a real Supabase project (it already has all of this).

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

grant anon, authenticated, service_role to current_user;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  raw_app_meta_data jsonb not null default '{}'::jsonb
);

-- Matches Supabase's real implementation: auth.uid() reads the "sub" claim
-- out of the request.jwt.claims GUC that PostgREST sets per-request. Tests
-- simulate a logged-in user with:
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<uuid>"}';
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select (nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub')::uuid;
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to anon, authenticated, service_role;
