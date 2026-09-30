-- Make an invalid complaint review atomically deduct 10 trust points once.
-- Re-running the invalid action is safe because each complaint can create only one penalty.
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
declare
  target_citizen_id uuid;
  penalty_rows integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if target_complaint_id is null then
    raise exception 'A complaint is required';
  end if;

  if review_decision not in ('Valid', 'Invalid') then
    raise exception 'Invalid review decision';
  end if;

  select complaint.citizen_id
  into target_citizen_id
  from public.complaints as complaint
  where complaint.id = target_complaint_id
  for update;

  if target_citizen_id is null then
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
    nullif(trim(review_notes), '')
  );

  if review_decision = 'Valid' then
    update public.complaints
    set status = case when status = 'Pending' then 'Under Review' else status end,
        updated_at = now()
    where id = target_complaint_id;

    return;
  end if;

  -- The unique complaint_id constraint makes the deduction idempotent.
  insert into public.trust_penalties (
    citizen_id,
    complaint_id,
    applied_by,
    points,
    reason
  )
  values (
    target_citizen_id,
    target_complaint_id,
    auth.uid(),
    10,
    coalesce(
      nullif(trim(review_notes), ''),
      'Complaint marked invalid after administrative evidence review.'
    )
  )
  on conflict (complaint_id) do nothing;

  get diagnostics penalty_created = row_count;

  if penalty_created then
    update public.profiles
    set trust_score = greatest(0, coalesce(trust_score, 0) - 10),
        updated_at = now()
    where id = target_citizen_id;

    if not found then
      raise exception 'Citizen profile not found';
    end if;

    insert into public.notifications (
      citizen_id,
      complaint_id,
      title,
      message,
      tone
    )
    values (
      target_citizen_id,
      target_complaint_id,
      'Trust score decreased',
      'Your complaint was marked invalid and 10 trust points were deducted.',
      'red'
    );
  end if;

  update public.complaints
  set status = 'Rejected',
      updated_at = now()
  where id = target_complaint_id;
end;
$$;

revoke all on function public.admin_review_complaint(uuid, text, text) from public;
grant execute on function public.admin_review_complaint(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
