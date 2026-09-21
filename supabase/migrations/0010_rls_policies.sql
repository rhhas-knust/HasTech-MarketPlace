-- ============================================================================
-- Row Level Security. This is the real tenant boundary -- the application
-- layer filters by store_id for convenience/performance, but every query
-- below is safe even if that filter were dropped or spoofed.
--
-- Conventions used throughout:
--   * `is_store_member(store_id)` / `is_store_owner(store_id)` (see
--     0009_functions_triggers.sql) gate all seller/staff access and already
--     fold in `is_platform_admin()`.
--   * Public storefront reads are scoped to `to public` policies that only
--     expose published/active rows.
--   * Tables that must NEVER be touched directly by anon/authenticated
--     (store_payment_credentials, payments, payment_events, carts,
--     cart_items, order writes, analytics writes, store_order_counters) get
--     RLS enabled with NO policy for those roles at all, which is a hard
--     default-deny -- only the service-role key (used exclusively by
--     trusted server code) can read/write them.
-- ============================================================================

alter table profiles enable row level security;
alter table platform_admins enable row level security;
alter table stores enable row level security;
alter table store_members enable row level security;
alter table store_settings enable row level security;
alter table store_payment_credentials enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table inventory_movements enable row level security;
alter table customers enable row level security;
alter table customer_addresses enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table payment_events enable row level security;
alter table analytics_events enable row level security;
alter table product_views enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table store_order_counters enable row level security;

-- A store is visible to the public once it is both administratively active
-- AND the seller has deliberately published it (spec onboarding step 7:
-- "Publish store"). Centralised here so products/categories/images/variants
-- all agree on the same definition.
create function is_store_publicly_visible(p_store_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from stores s
    where s.id = p_store_id and s.status = 'active' and s.published_at is not null
  );
$$;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy profiles_select_own on profiles for select to authenticated
  using (id = auth.uid() or is_platform_admin());
create policy profiles_update_own on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- platform_admins
-- ----------------------------------------------------------------------------
create policy platform_admins_select_self on platform_admins for select to authenticated
  using (user_id = auth.uid() or is_platform_admin());

-- ----------------------------------------------------------------------------
-- stores
-- ----------------------------------------------------------------------------
create policy stores_public_read on stores for select to public
  using (status = 'active' and published_at is not null);
create policy stores_member_read on stores for select to authenticated
  using (is_store_member(id));
create policy stores_insert_own on stores for insert to authenticated
  with check (owner_id = auth.uid());
create policy stores_member_update on stores for update to authenticated
  using (is_store_member(id)) with check (is_store_member(id));

-- ----------------------------------------------------------------------------
-- store_members
-- ----------------------------------------------------------------------------
create policy store_members_select on store_members for select to authenticated
  using (user_id = auth.uid() or is_store_member(store_id));
create policy store_members_insert on store_members for insert to authenticated
  with check (is_store_owner(store_id));
create policy store_members_update on store_members for update to authenticated
  using (is_store_owner(store_id)) with check (is_store_owner(store_id));
create policy store_members_delete on store_members for delete to authenticated
  using (is_store_owner(store_id));

-- ----------------------------------------------------------------------------
-- store_settings
-- ----------------------------------------------------------------------------
create policy store_settings_select on store_settings for select to authenticated
  using (is_store_member(store_id));
create policy store_settings_update on store_settings for update to authenticated
  using (is_store_owner(store_id)) with check (is_store_owner(store_id));

-- store_payment_credentials: intentionally NO policies. Service role only.

-- ----------------------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------------------
create policy categories_public_read on categories for select to public
  using (is_store_publicly_visible(store_id));
create policy categories_member_read on categories for select to authenticated
  using (is_store_member(store_id));
create policy categories_member_write on categories for insert to authenticated
  with check (is_store_member(store_id));
create policy categories_member_update on categories for update to authenticated
  using (is_store_member(store_id)) with check (is_store_member(store_id));
create policy categories_member_delete on categories for delete to authenticated
  using (is_store_member(store_id));

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create policy products_public_read on products for select to public
  using (status = 'published' and is_store_publicly_visible(store_id));
create policy products_member_read on products for select to authenticated
  using (is_store_member(store_id));
create policy products_member_write on products for insert to authenticated
  with check (is_store_member(store_id));
create policy products_member_update on products for update to authenticated
  using (is_store_member(store_id)) with check (is_store_member(store_id));
create policy products_member_delete on products for delete to authenticated
  using (is_store_member(store_id));

-- ----------------------------------------------------------------------------
-- product_images
-- ----------------------------------------------------------------------------
create policy product_images_public_read on product_images for select to public
  using (exists (
    select 1 from products p
    where p.id = product_images.product_id and p.status = 'published' and is_store_publicly_visible(p.store_id)
  ));
create policy product_images_member_read on product_images for select to authenticated
  using (exists (select 1 from products p where p.id = product_images.product_id and is_store_member(p.store_id)));
create policy product_images_member_write on product_images for insert to authenticated
  with check (exists (select 1 from products p where p.id = product_images.product_id and is_store_member(p.store_id)));
create policy product_images_member_update on product_images for update to authenticated
  using (exists (select 1 from products p where p.id = product_images.product_id and is_store_member(p.store_id)))
  with check (exists (select 1 from products p where p.id = product_images.product_id and is_store_member(p.store_id)));
create policy product_images_member_delete on product_images for delete to authenticated
  using (exists (select 1 from products p where p.id = product_images.product_id and is_store_member(p.store_id)));

-- ----------------------------------------------------------------------------
-- product_variants (same shape as product_images)
-- ----------------------------------------------------------------------------
create policy product_variants_public_read on product_variants for select to public
  using (exists (
    select 1 from products p
    where p.id = product_variants.product_id and p.status = 'published' and is_store_publicly_visible(p.store_id)
  ));
create policy product_variants_member_read on product_variants for select to authenticated
  using (exists (select 1 from products p where p.id = product_variants.product_id and is_store_member(p.store_id)));
create policy product_variants_member_write on product_variants for insert to authenticated
  with check (exists (select 1 from products p where p.id = product_variants.product_id and is_store_member(p.store_id)));
create policy product_variants_member_update on product_variants for update to authenticated
  using (exists (select 1 from products p where p.id = product_variants.product_id and is_store_member(p.store_id)))
  with check (exists (select 1 from products p where p.id = product_variants.product_id and is_store_member(p.store_id)));
create policy product_variants_member_delete on product_variants for delete to authenticated
  using (exists (select 1 from products p where p.id = product_variants.product_id and is_store_member(p.store_id)));

-- ----------------------------------------------------------------------------
-- inventory_movements: read-only to members, written only by triggers
-- ----------------------------------------------------------------------------
create policy inventory_movements_select on inventory_movements for select to authenticated
  using (is_store_member(store_id));

-- ----------------------------------------------------------------------------
-- customers
-- ----------------------------------------------------------------------------
create policy customers_select on customers for select to authenticated
  using (is_store_member(store_id) or user_id = auth.uid());
create policy customers_update on customers for update to authenticated
  using (is_store_member(store_id) or user_id = auth.uid())
  with check (is_store_member(store_id) or user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- customer_addresses
-- ----------------------------------------------------------------------------
create policy customer_addresses_select on customer_addresses for select to authenticated
  using (exists (
    select 1 from customers c where c.id = customer_addresses.customer_id
    and (is_store_member(c.store_id) or c.user_id = auth.uid())
  ));
create policy customer_addresses_write on customer_addresses for insert to authenticated
  with check (exists (
    select 1 from customers c where c.id = customer_addresses.customer_id and c.user_id = auth.uid()
  ));
create policy customer_addresses_update on customer_addresses for update to authenticated
  using (exists (
    select 1 from customers c where c.id = customer_addresses.customer_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from customers c where c.id = customer_addresses.customer_id and c.user_id = auth.uid()
  ));
create policy customer_addresses_delete on customer_addresses for delete to authenticated
  using (exists (
    select 1 from customers c where c.id = customer_addresses.customer_id and c.user_id = auth.uid()
  ));

-- ----------------------------------------------------------------------------
-- carts / cart_items: sellers can view (abandoned-cart analytics); all
-- mutation happens server-side via the service role, gated by a signed
-- cart-ownership cookie -- see src/lib/cart.ts.
-- ----------------------------------------------------------------------------
create policy carts_member_select on carts for select to authenticated
  using (is_store_member(store_id));
create policy cart_items_member_select on cart_items for select to authenticated
  using (exists (select 1 from carts c where c.id = cart_items.cart_id and is_store_member(c.store_id)));

-- ----------------------------------------------------------------------------
-- orders / order_items: sellers manage their own; customers see their own.
-- Creation and payment-reference writes happen server-side (service role)
-- so the authoritative amount is always server-calculated; sellers can
-- still update fulfilment/payment status for their own store from the
-- dashboard (e.g. confirming a cash-on-delivery payment).
-- ----------------------------------------------------------------------------
create policy orders_select on orders for select to authenticated
  using (
    is_store_member(store_id)
    or exists (select 1 from customers c where c.id = orders.customer_id and c.user_id = auth.uid())
  );
create policy orders_member_update on orders for update to authenticated
  using (is_store_member(store_id)) with check (is_store_member(store_id));

create policy order_items_select on order_items for select to authenticated
  using (exists (
    select 1 from orders o where o.id = order_items.order_id
    and (
      is_store_member(o.store_id)
      or exists (select 1 from customers c where c.id = o.customer_id and c.user_id = auth.uid())
    )
  ));

-- ----------------------------------------------------------------------------
-- payments: read-only to sellers. payment_events: service role only.
-- ----------------------------------------------------------------------------
create policy payments_select on payments for select to authenticated
  using (is_store_member(store_id));

-- ----------------------------------------------------------------------------
-- analytics_events / product_views: read-only to sellers. Writes only
-- through record_product_view / record_analytics_event (SECURITY DEFINER).
-- ----------------------------------------------------------------------------
create policy analytics_events_select on analytics_events for select to authenticated
  using (is_store_member(store_id));
create policy product_views_select on product_views for select to authenticated
  using (is_store_member(store_id));

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
create policy notifications_select on notifications for select to authenticated
  using (user_id = auth.uid() or (store_id is not null and is_store_member(store_id)));
create policy notifications_update on notifications for update to authenticated
  using (user_id = auth.uid() or (store_id is not null and is_store_member(store_id)))
  with check (user_id = auth.uid() or (store_id is not null and is_store_member(store_id)));

-- ----------------------------------------------------------------------------
-- audit_logs: read-only, store members (or platform admins for store_id
-- null / platform-level entries).
-- ----------------------------------------------------------------------------
create policy audit_logs_select on audit_logs for select to authenticated
  using ((store_id is not null and is_store_member(store_id)) or is_platform_admin());

-- store_order_counters, payment_events: intentionally NO policies at all.
