-- Extensions required by the platform.
-- pgcrypto provides gen_random_uuid(); Supabase projects already ship with
-- this enabled, but the migration is idempotent so it also works against a
-- plain Postgres instance (used for local RLS testing, see scripts/test-rls.sh).
create extension if not exists pgcrypto;
