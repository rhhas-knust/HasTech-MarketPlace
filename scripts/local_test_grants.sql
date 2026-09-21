-- Mirrors the table-level GRANTs a real Supabase project sets up
-- automatically for every table in `public` (RLS is the actual gate; these
-- grants just make anon/authenticated able to hit that gate at all, exactly
-- as they can on a real Supabase project).
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
