-- Tenant isolation tests. Run via scripts/test-rls.sh against a scratch
-- local Postgres database with the shim from local_test_shim.sql applied.
--
-- The single highest-priority security property of this platform (spec
-- section 48/6): Seller A must never be able to read or write Seller B's
-- products, orders, customers, payments or settings. This script proves it
-- against the real migrations, not just by reading the policy source.

\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on

-- ---------------------------------------------------------------------------
-- Fixtures: two independent sellers, each with a store, a product, a
-- customer and an order.
-- ---------------------------------------------------------------------------
reset role;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner-a@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'owner-b@example.com');

insert into stores (id, owner_id, name, slug, business_type, status, published_at)
values
  ('00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-00000000000a', 'Amara Books', 'amara-books', 'retail', 'active', now()),
  ('00000000-0000-0000-0000-0000000000bb', '00000000-0000-0000-0000-00000000000b', 'Kojo Electronics', 'kojo-electronics', 'retail', 'active', now());

insert into products (id, store_id, name, slug, price, status)
values
  ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-0000000000aa', 'Understanding Salvation', 'understanding-salvation', 45.00, 'published'),
  ('00000000-0000-0000-0000-00000000aaad', '00000000-0000-0000-0000-0000000000aa', 'Unpublished Draft (A)', 'draft-a', 20.00, 'draft'),
  ('00000000-0000-0000-0000-00000000bbbb', '00000000-0000-0000-0000-0000000000bb', 'Wireless Earbuds', 'wireless-earbuds', 150.00, 'published'),
  ('00000000-0000-0000-0000-00000000bbbd', '00000000-0000-0000-0000-0000000000bb', 'Unpublished Draft (B)', 'draft-b', 300.00, 'draft');

insert into customers (id, store_id, email, first_name)
values
  ('00000000-0000-0000-0000-0000000ca001', '00000000-0000-0000-0000-0000000000aa', 'buyer1@example.com', 'Ama'),
  ('00000000-0000-0000-0000-0000000cb001', '00000000-0000-0000-0000-0000000000bb', 'buyer2@example.com', 'Kofi');

insert into orders (id, store_id, customer_id, subtotal, delivery_fee, discount, total, payment_status)
values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-0000000ca001', 45.00, 0, 0, 45.00, 'paid'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000bb', '00000000-0000-0000-0000-0000000cb001', 150.00, 0, 0, 150.00, 'paid');

insert into payments (id, store_id, order_id, reference, amount, status)
values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-0000000000d1', 'ref-a-1', 45.00, 'success'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000bb', '00000000-0000-0000-0000-0000000000d2', 'ref-b-1', 150.00, 'success');

insert into store_payment_credentials (store_id, public_key, secret_key)
values
  ('00000000-0000-0000-0000-0000000000aa', 'pk_test_a', 'sk_test_a'),
  ('00000000-0000-0000-0000-0000000000bb', 'pk_test_b', 'sk_test_b');

-- ---------------------------------------------------------------------------
-- Assert helper: raises if a condition is false.
-- ---------------------------------------------------------------------------
create or replace function _assert(label text, ok boolean) returns void
language plpgsql as $$
begin
  if not ok then
    raise exception 'FAILED: %', label;
  else
    raise notice 'OK: %', label;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Act as Seller A (owner of Amara Books).
-- ---------------------------------------------------------------------------
set role authenticated;
set request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a"}';

select _assert(
  'seller A sees own draft product',
  exists (select 1 from products where id = '00000000-0000-0000-0000-00000000aaad')
);

select _assert(
  'seller A sees seller B''s PUBLISHED product (public catalogue)',
  exists (select 1 from products where id = '00000000-0000-0000-0000-00000000bbbb')
);

select _assert(
  'seller A does NOT see seller B''s draft product',
  not exists (select 1 from products where id = '00000000-0000-0000-0000-00000000bbbd')
);

select _assert(
  'seller A sees only own orders',
  (select count(*) from orders) = 1
  and exists (select 1 from orders where id = '00000000-0000-0000-0000-0000000000d1')
  and not exists (select 1 from orders where id = '00000000-0000-0000-0000-0000000000d2')
);

select _assert(
  'seller A sees only own customers',
  (select count(*) from customers) = 1
  and exists (select 1 from customers where id = '00000000-0000-0000-0000-0000000ca001')
);

select _assert(
  'seller A sees only own payments',
  (select count(*) from payments) = 1
  and exists (select 1 from payments where reference = 'ref-a-1')
);

select _assert(
  'seller A cannot read seller B''s payment credentials',
  not exists (select 1 from store_payment_credentials where store_id = '00000000-0000-0000-0000-0000000000bb')
);

select _assert(
  'seller A cannot even read OWN payment credentials via client role (service-role only)',
  not exists (select 1 from store_payment_credentials where store_id = '00000000-0000-0000-0000-0000000000aa')
);

-- Attempting to update seller B's product should silently affect 0 rows.
update products set price = 1.00 where id = '00000000-0000-0000-0000-00000000bbbb';
select _assert(
  'seller A UPDATE on seller B''s product affected 0 rows',
  (select price from products where id = '00000000-0000-0000-0000-00000000bbbb') = 150.00
);

-- Attempting to write payment credentials must be rejected outright.
do $$
begin
  insert into store_payment_credentials (store_id, secret_key) values ('00000000-0000-0000-0000-0000000000aa', 'sk_hacked');
  raise exception 'SECURITY REGRESSION: authenticated seller inserted into store_payment_credentials';
exception
  when insufficient_privilege then
    raise notice 'OK: store_payment_credentials insert correctly denied to authenticated role';
end
$$;

-- Direct writes to analytics tables (bypassing the SECURITY DEFINER
-- functions) must be rejected -- otherwise any store could forge another
-- store's analytics.
do $$
begin
  insert into product_views (store_id, product_id, visitor_id)
  values ('00000000-0000-0000-0000-0000000000bb', '00000000-0000-0000-0000-00000000bbbb', 'forged-visitor');
  raise exception 'SECURITY REGRESSION: authenticated seller inserted directly into product_views';
exception
  when insufficient_privilege then
    raise notice 'OK: direct product_views insert correctly denied to authenticated role';
end
$$;

-- ---------------------------------------------------------------------------
-- Act as an anonymous storefront visitor.
-- ---------------------------------------------------------------------------
reset request.jwt.claims;
set role anon;

-- Regression test: 0012 once revoked EXECUTE on is_store_member() from anon
-- while, in the same migration, folding it into the `to public` policy on
-- `stores` -- a self-contradiction that surfaced in production (Postgres 17)
-- as "permission denied for function is_store_member" on exactly this query
-- (see 0013_fix_public_execute_grants.sql), confirmed directly against the
-- live database. Note: this specific failure did not reproduce against local
-- Postgres 16 even with the grant removed -- its planner evidently
-- short-circuits this OR differently than Supabase's Postgres 17 does, and
-- Postgres gives no guarantee either way. That gap is exactly why this
-- assertion exists: don't rely on the products/categories checks below (or
-- on this local harness at all) to catch a missing grant reached through an
-- OR clause -- assert directly, and confirm against the real project after
-- any change to what these functions are granted to.
select _assert(
  'anon can read the published store row directly (no permission error)',
  exists (select 1 from stores where slug = 'amara-books')
);

select _assert(
  'anon sees published products from both stores',
  (select count(*) from products where id in (
    '00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-00000000bbbb'
  )) = 2
);

select _assert(
  'anon does NOT see any draft product',
  (select count(*) from products where status = 'draft') = 0
);

select _assert(
  'anon has no visibility into orders at all',
  (select count(*) from orders) = 0
);

select _assert(
  'anon has no visibility into payment credentials',
  (select count(*) from store_payment_credentials) = 0
);

reset role;
update stores set published_at = null where id = '00000000-0000-0000-0000-0000000000bb';
set role anon;

select _assert(
  'an unpublished store''s products disappear from the public catalogue even while active',
  not exists (select 1 from products where id = '00000000-0000-0000-0000-00000000bbbb')
);

reset role;
update stores set published_at = now() where id = '00000000-0000-0000-0000-0000000000bb';
set role anon;

-- The analytics RPC path (record_product_view) is the sanctioned way for an
-- anonymous visitor to write a view; the first call should count, and a
-- second immediate call for the same visitor should be deduplicated.
select _assert(
  'first product view by a new visitor is recorded',
  record_product_view(
    '00000000-0000-0000-0000-0000000000aa'::uuid,
    '00000000-0000-0000-0000-00000000aaaa'::uuid,
    'visitor-xyz'
  ) = true
);

select _assert(
  'immediate repeat view by the same visitor is deduplicated',
  record_product_view(
    '00000000-0000-0000-0000-0000000000aa'::uuid,
    '00000000-0000-0000-0000-00000000aaaa'::uuid,
    'visitor-xyz'
  ) = false
);

reset role;
select _assert(
  'view_count incremented exactly once despite two calls',
  (select view_count from products where id = '00000000-0000-0000-0000-00000000aaaa') = 1
);

do $$
begin
  set role anon;
  insert into analytics_events (store_id, event_type, visitor_id) values
    ('00000000-0000-0000-0000-0000000000aa', 'product_view', 'forged');
  raise exception 'SECURITY REGRESSION: anon inserted directly into analytics_events';
exception
  when insufficient_privilege then
    raise notice 'OK: direct analytics_events insert correctly denied to anon role';
end
$$;
reset role;

-- ---------------------------------------------------------------------------
-- Act as Seller B: symmetric spot-check that isolation is not one-directional.
-- ---------------------------------------------------------------------------
set role authenticated;
set request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b"}';

select _assert(
  'seller B sees only own orders',
  (select count(*) from orders) = 1
  and exists (select 1 from orders where id = '00000000-0000-0000-0000-0000000000d2')
);

select _assert(
  'seller B cannot see seller A''s customer record',
  not exists (select 1 from customers where id = '00000000-0000-0000-0000-0000000ca001')
);

reset request.jwt.claims;
reset role;

drop function _assert(text, boolean);

\echo ''
\echo 'ALL TENANT ISOLATION CHECKS PASSED'
