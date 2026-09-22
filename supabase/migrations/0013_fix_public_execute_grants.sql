-- ============================================================================
-- Fixes a self-contradiction introduced in 0012_security_performance_hardening.sql:
-- that migration both (a) revoked EXECUTE on is_platform_admin/is_store_member/
-- is_store_owner from anon, reasoning "no `to public` policy calls them", and
-- (b) in the same file, collapsed stores/categories/products/product_images/
-- product_variants' separate public+member SELECT policies into one `to public`
-- policy that DOES call is_store_member() in its OR clause.
--
-- Postgres does not guarantee short-circuit evaluation of OR across arbitrary
-- query plans, so whether the missing grant actually surfaced as
-- "permission denied for function is_store_member" depended on plan shape --
-- it happened to stay hidden for products/categories (whose published-rows
-- test cases let the left disjunct dominate) and surfaced immediately for
-- stores in production. Any `to public` policy that reaches one of these
-- functions requires anon to have EXECUTE on it, full stop, regardless of
-- clause order.
--
-- These are still safe for anon to execute: is_store_member/is_store_owner/
-- is_platform_admin all key off auth.uid(), which is null for anon, so they
-- always evaluate false for that role and reveal nothing.
-- ============================================================================

grant execute on function is_platform_admin() to anon;
grant execute on function is_store_member(uuid) to anon;
grant execute on function is_store_owner(uuid) to anon;
