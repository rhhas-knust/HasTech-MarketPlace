-- Founding members now get two months free from the day their store is
-- created, instead of "until the end of the current month".

create or replace function assign_platform_billing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_founding_count integer;
begin
  select count(*) into v_founding_count from platform_billing where is_founding_member = true;

  insert into platform_billing (store_id, is_founding_member, founding_member_until)
  values (
    new.id,
    v_founding_count < 10,
    case when v_founding_count < 10 then now() + interval '2 months' else null end
  )
  on conflict (store_id) do nothing;

  return new;
end;
$$;

-- Existing founding members: two months from their own store's creation.
update platform_billing pb
set founding_member_until = s.created_at + interval '2 months',
    updated_at = now()
from stores s
where s.id = pb.store_id
  and pb.is_founding_member = true;
