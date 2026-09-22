-- Store logo storage, mirroring 0011_storage.sql's guarded pattern so this
-- migration is a safe no-op against the plain local Postgres used by
-- scripts/rls_isolation_tests.sql (which has no `storage` schema).
--
-- Bucket layout: store-logos/<store_id>/logo.<ext> -- a fixed filename (not
-- a random one) so re-uploading a logo replaces the old file instead of
-- accumulating orphaned objects every time a seller changes their mind.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then

    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('store-logos', 'store-logos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;

    execute $policy$
      create policy store_logos_storage_public_read on storage.objects for select to public
        using (bucket_id = 'store-logos')
    $policy$;

    execute $policy$
      create policy store_logos_storage_member_write on storage.objects for insert to authenticated
        with check (
          bucket_id = 'store-logos'
          and is_store_member(((storage.foldername(name))[1])::uuid)
        )
    $policy$;

    execute $policy$
      create policy store_logos_storage_member_update on storage.objects for update to authenticated
        using (
          bucket_id = 'store-logos'
          and is_store_member(((storage.foldername(name))[1])::uuid)
        )
    $policy$;

    execute $policy$
      create policy store_logos_storage_member_delete on storage.objects for delete to authenticated
        using (
          bucket_id = 'store-logos'
          and is_store_member(((storage.foldername(name))[1])::uuid)
        )
    $policy$;

  end if;
end
$$;
