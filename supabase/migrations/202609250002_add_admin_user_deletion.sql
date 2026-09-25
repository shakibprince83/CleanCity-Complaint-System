-- Secure administrator-only deletion for citizen and volunteer accounts.
create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role text;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot delete your own administrator account';
  end if;

  select role
  into target_role
  from public.profiles
  where id = target_user_id;

  if target_role is null then
    raise exception 'Account not found';
  end if;

  if target_role = 'admin' then
    raise exception 'Administrator accounts cannot be deleted from user management';
  end if;

  delete from auth.users
  where id = target_user_id;

  if not found then
    raise exception 'Authentication account not found';
  end if;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

notify pgrst, 'reload schema';
