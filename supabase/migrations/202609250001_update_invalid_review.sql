-- Make validity decisions update the complaint workflow status.
create or replace function public.admin_review_complaint(
  target_complaint_id uuid,
  review_decision text,
  review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if review_decision not in ('Valid', 'Invalid') then
    raise exception 'Invalid review decision';
  end if;

  if not exists (
    select 1 from public.complaints where id = target_complaint_id
  ) then
    raise exception 'Complaint not found';
  end if;

  insert into public.complaint_reviews (
    complaint_id,
    reviewed_by,
    decision,
    notes
  )
  values (
    target_complaint_id,
    auth.uid(),
    review_decision,
    review_notes
  );

  update public.complaints
  set
    status = case
      when review_decision = 'Invalid' then 'Rejected'
      when status = 'Pending' then 'Under Review'
      else status
    end,
    updated_at = now()
  where id = target_complaint_id;
end;
$$;

revoke all on function public.admin_review_complaint(uuid, text, text) from public;
grant execute on function public.admin_review_complaint(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
