-- Allow active administrators to permanently delete rejected complaints only.
create or replace function public.admin_delete_rejected_complaint(
  target_complaint_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_status text;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  select status
  into target_status
  from public.complaints
  where id = target_complaint_id
  for update;

  if target_status is null then
    raise exception 'Complaint not found';
  end if;

  if target_status <> 'Rejected' then
    raise exception 'Only rejected complaints can be deleted';
  end if;

  delete from public.complaints
  where id = target_complaint_id;
end;
$$;

revoke all on function public.admin_delete_rejected_complaint(uuid) from public;
grant execute on function public.admin_delete_rejected_complaint(uuid) to authenticated;

notify pgrst, 'reload schema';
