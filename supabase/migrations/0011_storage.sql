-- Product image storage. Guarded by a schema-existence check so this
-- migration is a safe no-op against the plain local Postgres used by
-- scripts/test-rls.sh (which has no `storage` schema) and only takes effect
-- against a real Supabase project.
--
-- Bucket layout: product-images/<store_id>/<product_id>/<filename>. Uploads
-- happen server-side (see src/lib/product-images.ts) via the service-role
-- client after an explicit store-membership check, so these RLS policies on
-- storage.objects are defense-in-depth for any future direct-from-browser
-- upload path, not the only thing standing between an attacker and another
-- store's files.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then

    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    on conflict (id) do nothing;

    execute $policy$
      create policy product_images_storage_public_read on storage.objects for select to public
        using (bucket_id = 'product-images')
    $policy$;

    execute $policy$
      create policy product_images_storage_member_write on storage.objects for insert to authenticated
        with check (
          bucket_id = 'product-images'
          and is_store_member(((storage.foldername(name))[1])::uuid)
        )
    $policy$;

    execute $policy$
      create policy product_images_storage_member_update on storage.objects for update to authenticated
        using (
          bucket_id = 'product-images'
          and is_store_member(((storage.foldername(name))[1])::uuid)
        )
    $policy$;

    execute $policy$
      create policy product_images_storage_member_delete on storage.objects for delete to authenticated
        using (
          bucket_id = 'product-images'
          and is_store_member(((storage.foldername(name))[1])::uuid)
        )
    $policy$;

  end if;
end
$$;
