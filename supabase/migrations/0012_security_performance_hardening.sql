-- ============================================================================
-- Hardening pass driven by Supabase's security/performance advisors, run
-- immediately after 0001-0011 were first applied to a real project.
--
-- Left deliberately UNCHANGED (verified intentional, not bugs):
--   * rls_enabled_no_policy on store_payment_credentials, payment_events,
--     store_order_counters -- these must have zero anon/authenticated
--     policies by design (service-role only). See 0010_rls_policies.sql.
--   * anon/authenticated can still execute record_product_view and
--     record_analytics_event -- that IS their purpose (anonymous storefront
--     visitors call them directly). See 0009_functions_triggers.sql.
--   * "unused index" findings -- expected on a freshly created project with
--     no data/traffic yet; these indexes back real query patterns used by
--     src/lib/*.ts and will show usage once the app is live.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Mutable search_path (WARN). Without a pinned search_path, a function
--    resolves unqualified identifiers using whatever search_path the
--    calling session has set, which is a known privilege-escalation vector
--    for SECURITY DEFINER functions and best practice to close even for
--    non-definer ones.
-- ----------------------------------------------------------------------------
alter function set_updated_at() set search_path = public;
alter function set_order_number() set search_path = public;
alter function is_store_publicly_visible(uuid) set search_path = public;

-- ----------------------------------------------------------------------------
-- 2. Over-broad EXECUTE grants (WARN). Supabase grants EXECUTE on new
--    functions to anon/authenticated by default. Most of these functions
--    were only ever meant to be invoked as triggers or from inside other
--    SECURITY DEFINER functions -- not called directly over
--    /rest/v1/rpc/<fn> by a browser. Revoking does not affect the trigger
--    firing path (trigger invocation isn't gated by the invoking session's
--    EXECUTE privilege) or service_role (untouched below, and it's what
--    actually performs order creation).
-- ----------------------------------------------------------------------------
revoke execute on function apply_order_stock_effects() from public, anon, authenticated;
revoke execute on function handle_new_store() from public, anon, authenticated;
revoke execute on function handle_new_user() from public, anon, authenticated;
revoke execute on function generate_order_number(uuid) from public, anon, authenticated;

-- is_platform_admin/is_store_member/is_store_owner ARE genuinely needed by
-- `authenticated` (they're called inside several `to authenticated`
-- policies), but no `to public`/anon policy calls them -- see
-- 0010_rls_policies.sql. Narrow the grant accordingly.
revoke execute on function is_platform_admin() from public, anon;
revoke execute on function is_store_member(uuid) from public, anon;
revoke execute on function is_store_owner(uuid) from public, anon;

-- ----------------------------------------------------------------------------
-- 3. Document the intentionally-policy-less tables directly on the table,
--    so this doesn't have to be rediscovered from migration history.
-- ----------------------------------------------------------------------------
comment on table store_payment_credentials is
  'RLS enabled, zero policies for anon/authenticated by design -- service role only. See src/lib/payments and README security model.';
comment on table payment_events is
  'RLS enabled, zero policies for anon/authenticated by design -- service role only, webhook/verification idempotency ledger.';
comment on table store_order_counters is
  'RLS enabled, zero policies for anon/authenticated by design -- internal to generate_order_number(), never queried directly.';

-- ----------------------------------------------------------------------------
-- 4. auth_rls_initplan (WARN): a bare auth.uid() in a policy is
--    re-evaluated per row; (select auth.uid()) lets Postgres evaluate it
--    once per query instead. Purely a performance fix -- semantics
--    unchanged.
-- ----------------------------------------------------------------------------
alter policy profiles_select_own on profiles
  using (id = (select auth.uid()) or is_platform_admin());
alter policy profiles_update_own on profiles
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter policy platform_admins_select_self on platform_admins
  using (user_id = (select auth.uid()) or is_platform_admin());

alter policy stores_insert_own on stores
  with check (owner_id = (select auth.uid()));

alter policy store_members_select on store_members
  using (user_id = (select auth.uid()) or is_store_member(store_id));

alter policy customers_select on customers
  using (is_store_member(store_id) or user_id = (select auth.uid()));
alter policy customers_update on customers
  using (is_store_member(store_id) or user_id = (select auth.uid()))
  with check (is_store_member(store_id) or user_id = (select auth.uid()));

alter policy customer_addresses_select on customer_addresses
  using (exists (
    select 1 from customers c where c.id = customer_addresses.customer_id
    and (is_store_member(c.store_id) or c.user_id = (select auth.uid()))
  ));
alter policy customer_addresses_write on customer_addresses
  with check (exists (
    select 1 from customers c where c.id = customer_addresses.customer_id and c.user_id = (select auth.uid())
  ));
alter policy customer_addresses_update on customer_addresses
  using (exists (
    select 1 from customers c where c.id = customer_addresses.customer_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from customers c where c.id = customer_addresses.customer_id and c.user_id = (select auth.uid())
  ));
alter policy customer_addresses_delete on customer_addresses
  using (exists (
    select 1 from customers c where c.id = customer_addresses.customer_id and c.user_id = (select auth.uid())
  ));

alter policy orders_select on orders
  using (
    is_store_member(store_id)
    or exists (select 1 from customers c where c.id = orders.customer_id and c.user_id = (select auth.uid()))
  );

alter policy order_items_select on order_items
  using (exists (
    select 1 from orders o where o.id = order_items.order_id
    and (
      is_store_member(o.store_id)
      or exists (select 1 from customers c where c.id = o.customer_id and c.user_id = (select auth.uid()))
    )
  ));

alter policy notifications_select on notifications
  using (user_id = (select auth.uid()) or (store_id is not null and is_store_member(store_id)));
alter policy notifications_update on notifications
  using (user_id = (select auth.uid()) or (store_id is not null and is_store_member(store_id)))
  with check (user_id = (select auth.uid()) or (store_id is not null and is_store_member(store_id)));

-- ----------------------------------------------------------------------------
-- 5. Missing covering indexes on foreign keys (INFO). Matters most for
--    delete/update cascade checks and joins from the child side.
-- ----------------------------------------------------------------------------
create index analytics_events_order_id_idx on analytics_events (order_id);
create index analytics_events_product_id_idx on analytics_events (product_id);
create index audit_logs_actor_id_idx on audit_logs (actor_id);
create index cart_items_product_id_idx on cart_items (product_id);
create index carts_customer_id_idx on carts (customer_id);
create index categories_parent_id_idx on categories (parent_id);
create index inventory_movements_created_by_idx on inventory_movements (created_by);
create index orders_delivery_address_id_idx on orders (delivery_address_id);

-- ----------------------------------------------------------------------------
-- 6. Multiple permissive policies (WARN): stores/categories/products/
--    product_images/product_variants each had a separate `to public` and
--    `to authenticated` SELECT policy, which Postgres must evaluate and OR
--    together on every query for the authenticated role. Collapsing each
--    pair into a single `to public` policy is behaviourally identical
--    (is_store_member() safely evaluates false for anon, since auth.uid()
--    is null for that role) but only costs one policy evaluation.
-- ----------------------------------------------------------------------------
drop policy stores_public_read on stores;
drop policy stores_member_read on stores;
create policy stores_read on stores for select to public
  using ((status = 'active' and published_at is not null) or is_store_member(id));

drop policy categories_public_read on categories;
drop policy categories_member_read on categories;
create policy categories_read on categories for select to public
  using (is_store_publicly_visible(store_id) or is_store_member(store_id));

drop policy products_public_read on products;
drop policy products_member_read on products;
create policy products_read on products for select to public
  using ((status = 'published' and is_store_publicly_visible(store_id)) or is_store_member(store_id));

drop policy product_images_public_read on product_images;
drop policy product_images_member_read on product_images;
create policy product_images_read on product_images for select to public
  using (
    exists (
      select 1 from products p
      where p.id = product_images.product_id
        and (
          (p.status = 'published' and is_store_publicly_visible(p.store_id))
          or is_store_member(p.store_id)
        )
    )
  );

drop policy product_variants_public_read on product_variants;
drop policy product_variants_member_read on product_variants;
create policy product_variants_read on product_variants for select to public
  using (
    exists (
      select 1 from products p
      where p.id = product_variants.product_id
        and (
          (p.status = 'published' and is_store_publicly_visible(p.store_id))
          or is_store_member(p.store_id)
        )
    )
  );
