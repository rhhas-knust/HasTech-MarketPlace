-- ============================================================================
-- Helper functions, order numbering, stock/audit side effects, and the
-- analytics write path.
-- ============================================================================

alter table orders add column stock_decremented boolean not null default false;

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on profiles for each row execute function set_updated_at();
create trigger set_updated_at before update on stores for each row execute function set_updated_at();
create trigger set_updated_at before update on store_settings for each row execute function set_updated_at();
create trigger set_updated_at before update on store_payment_credentials for each row execute function set_updated_at();
create trigger set_updated_at before update on categories for each row execute function set_updated_at();
create trigger set_updated_at before update on products for each row execute function set_updated_at();
create trigger set_updated_at before update on customers for each row execute function set_updated_at();
create trigger set_updated_at before update on carts for each row execute function set_updated_at();
create trigger set_updated_at before update on cart_items for each row execute function set_updated_at();
create trigger set_updated_at before update on orders for each row execute function set_updated_at();
create trigger set_updated_at before update on payments for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS helper functions. SECURITY DEFINER + owned by the migration role
-- (which owns the underlying tables) means these read store_members without
-- being subject to store_members' own RLS policies -- this is what avoids
-- infinite recursion between "can I read store_members" and "am I a member".
-- ----------------------------------------------------------------------------
create function is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from platform_admins where user_id = auth.uid()
  );
$$;

create function is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from store_members
    where store_id = p_store_id and user_id = auth.uid()
  ) or is_platform_admin();
$$;

create function is_store_owner(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from store_members
    where store_id = p_store_id and user_id = auth.uid() and role = 'owner'
  ) or is_platform_admin();
$$;

grant execute on function is_platform_admin() to anon, authenticated;
grant execute on function is_store_member(uuid) to anon, authenticated;
grant execute on function is_store_owner(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Order numbering: "<PREFIX>-<sequence>" per store, e.g. "AB-1000".
-- An atomic UPDATE ... RETURNING avoids the race condition a
-- read-then-insert approach would have under concurrent checkouts.
-- ----------------------------------------------------------------------------
create table store_order_counters (
  store_id uuid primary key references stores (id) on delete cascade,
  next_number integer not null default 1000
);

create function generate_order_number(p_store_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_number integer;
begin
  insert into store_order_counters (store_id) values (p_store_id)
  on conflict (store_id) do nothing;

  update store_order_counters
  set next_number = next_number + 1
  where store_id = p_store_id
  returning next_number - 1 into v_number;

  select coalesce(
    nullif(s.order_number_prefix, ''),
    upper(left(regexp_replace(st.slug, '[^a-z0-9]', '', 'g'), 2))
  )
  into v_prefix
  from stores st
  left join store_settings s on s.store_id = st.id
  where st.id = p_store_id;

  return coalesce(v_prefix, 'HS') || '-' || v_number;
end;
$$;

create function set_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null then
    new.order_number := generate_order_number(new.store_id);
  end if;
  return new;
end;
$$;

create trigger set_order_number
  before insert on orders
  for each row execute function set_order_number();

-- ----------------------------------------------------------------------------
-- Stock + audit side effects when an order is marked paid, and restock when
-- a paid order is later cancelled/refunded. Guarded by stock_decremented so
-- this can never run twice for the same order.
-- ----------------------------------------------------------------------------
create function apply_order_stock_effects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status = 'paid' and old.payment_status <> 'paid' and not new.stock_decremented then
    update products p
    set stock_quantity = greatest(p.stock_quantity - oi.quantity, 0),
        purchase_count = p.purchase_count + oi.quantity
    from order_items oi
    where oi.order_id = new.id
      and oi.product_id = p.id
      and p.track_inventory = true;

    insert into inventory_movements (store_id, product_id, change_qty, reason, reference_id)
    select new.store_id, oi.product_id, -oi.quantity, 'sale', new.id
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.order_id = new.id and p.track_inventory = true;

    new.stock_decremented := true;

    insert into audit_logs (store_id, action, entity_type, entity_id, metadata)
    values (new.store_id, 'order.paid', 'order', new.id,
      jsonb_build_object('order_number', new.order_number, 'total', new.total));

  elsif new.fulfilment_status in ('cancelled', 'refunded')
        and old.fulfilment_status not in ('cancelled', 'refunded')
        and new.stock_decremented then
    update products p
    set stock_quantity = p.stock_quantity + oi.quantity
    from order_items oi
    where oi.order_id = new.id and oi.product_id = p.id and p.track_inventory = true;

    insert into inventory_movements (store_id, product_id, change_qty, reason, reference_id)
    select new.store_id, oi.product_id, oi.quantity, 'order_cancelled', new.id
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.order_id = new.id and p.track_inventory = true;

    insert into audit_logs (store_id, action, entity_type, entity_id, metadata)
    values (new.store_id, 'order.' || new.fulfilment_status, 'order', new.id,
      jsonb_build_object('order_number', new.order_number));
  end if;

  return new;
end;
$$;

create trigger apply_order_stock_effects
  before update on orders
  for each row execute function apply_order_stock_effects();

-- ----------------------------------------------------------------------------
-- Analytics write path. These are the ONLY way rows land in
-- analytics_events / product_views -- see 0010_rls_policies.sql, which
-- grants no direct table INSERT to anon/authenticated. SECURITY DEFINER
-- lets an anonymous storefront visitor record a view without needing write
-- access to the underlying tables, while the function body validates the
-- product/store relationship so a caller cannot spoof another store's data.
-- ----------------------------------------------------------------------------
create function record_product_view(
  p_store_id uuid,
  p_product_id uuid,
  p_visitor_id text,
  p_session_id text default null,
  p_source text default null,
  p_device_type text default null,
  p_country text default null,
  p_dedupe_window interval default interval '30 minutes'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valid boolean;
  v_recent boolean;
begin
  select exists (
    select 1 from products where id = p_product_id and store_id = p_store_id
  ) into v_valid;

  if not v_valid or p_visitor_id is null or length(p_visitor_id) = 0 then
    return false;
  end if;

  select exists (
    select 1 from product_views
    where product_id = p_product_id
      and visitor_id = p_visitor_id
      and created_at > now() - p_dedupe_window
  ) into v_recent;

  if v_recent then
    return false;
  end if;

  insert into product_views (store_id, product_id, session_id, visitor_id, source, device_type, country)
  values (p_store_id, p_product_id, p_session_id, p_visitor_id, p_source, p_device_type, p_country);

  insert into analytics_events (store_id, event_type, product_id, session_id, visitor_id, source, device_type, country)
  values (p_store_id, 'product_view', p_product_id, p_session_id, p_visitor_id, p_source, p_device_type, p_country);

  update products set view_count = view_count + 1 where id = p_product_id;

  return true;
end;
$$;

grant execute on function record_product_view(uuid, uuid, text, text, text, text, text, interval) to anon, authenticated;

create function record_analytics_event(
  p_store_id uuid,
  p_event_type text,
  p_product_id uuid default null,
  p_order_id uuid default null,
  p_session_id text default null,
  p_visitor_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_source text default null,
  p_device_type text default null,
  p_country text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_product_id is not null and not exists (
    select 1 from products where id = p_product_id and store_id = p_store_id
  ) then
    raise exception 'product % does not belong to store %', p_product_id, p_store_id;
  end if;

  if p_order_id is not null and not exists (
    select 1 from orders where id = p_order_id and store_id = p_store_id
  ) then
    raise exception 'order % does not belong to store %', p_order_id, p_store_id;
  end if;

  insert into analytics_events (
    store_id, event_type, product_id, order_id, session_id, visitor_id,
    metadata, source, device_type, country
  )
  values (
    p_store_id, p_event_type, p_product_id, p_order_id, p_session_id, p_visitor_id,
    coalesce(p_metadata, '{}'::jsonb), p_source, p_device_type, p_country
  )
  returning id into v_id;

  if p_event_type = 'add_to_cart' and p_product_id is not null then
    update products set add_to_cart_count = add_to_cart_count + 1 where id = p_product_id;
  end if;

  return v_id;
end;
$$;

grant execute on function record_analytics_event(uuid, text, uuid, uuid, text, text, jsonb, text, text, text) to anon, authenticated;
