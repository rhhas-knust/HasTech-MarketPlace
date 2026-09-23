-- ============================================================================
-- Digital product delivery: a seller can attach one downloadable file (an
-- ebook PDF, a PSD/AI design file, a zipped bundle, ...) to a product.
-- Customers get a time-limited download link once their order is paid --
-- never a public URL, since the whole point is that only paying customers
-- get the file. Snapshotted onto order_items (like product_name and
-- is_preorder already are) so a past order still resolves to the exact
-- file version that was purchased even if the seller later replaces it.
-- ============================================================================

alter table products
  add column digital_file_path text,
  add column digital_file_name text,
  add column digital_file_size bigint;

alter table order_items
  add column digital_file_path text,
  add column digital_file_name text;

-- Mirrors 0011_storage.sql's guarded pattern so this migration is a safe
-- no-op against the plain local Postgres used by scripts/rls_isolation_tests.sql
-- (which has no `storage` schema).
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then

    -- Private: unlike product-images/store-logos, nothing about this bucket
    -- is meant to be publicly reachable by URL. There are deliberately NO
    -- storage.objects policies here (same reasoning as
    -- store_payment_credentials in 0010_rls_policies.sql) -- every read and
    -- write goes through the service-role client after an explicit
    -- authorization check: store-membership for sellers managing the file
    -- (src/lib/product-files.ts), a paid-order match for a customer's
    -- download link (src/lib/digital-downloads.ts).
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('product-files', 'product-files', false, 20971520)
    on conflict (id) do nothing;

  end if;
end
$$;
