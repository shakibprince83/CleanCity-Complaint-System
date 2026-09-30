-- Apply an invalid-complaint penalty to the exact complaint owner and return the new score.
-- A citizen may be penalized for multiple invalid complaints, but each complaint only once.
create or replace function public.admin_mark_complaint_invalid(
  target_complaint_id uuid,
  review_notes text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_citizen_id uuid;
  penalty_created boolean := false;
  updated_trust_score integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if target_complaint_id is null then
    raise exception 'A complaint is required';
  end if;

  select complaint.citizen_id
  into target_citizen_id
  from public.complaints as complaint
  where complaint.id = target_complaint_id
  for update;

  if target_citizen_id is null then
    raise exception 'Complaint not found or has no citizen owner';
  end if;

  -- Lock the exact owner profile so simultaneous penalties cannot overwrite each other.
  perform 1
  from public.profiles
  where id = target_citizen_id
  for update;

  if not found then
    raise exception 'Citizen profile not found';
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
    'Invalid',
    coalesce(
      nullif(trim(review_notes), ''),
      'Complaint marked invalid after administrative evidence review.'
    )
  );

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
  on conflict (complaint_id) do nothing
  returning true into penalty_created;

  if coalesce(penalty_created, false) then
    update public.profiles
    set trust_score = greatest(0, coalesce(trust_score, 0) - 10),
        updated_at = now()
    where id = target_citizen_id
    returning trust_score into updated_trust_score;

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
  else
    select trust_score
    into updated_trust_score
    from public.profiles
    where id = target_citizen_id;
  end if;

  update public.complaints
  set status = 'Rejected',
      updated_at = now()
  where id = target_complaint_id;

  return updated_trust_score;
end;
$$;

revoke all on function public.admin_mark_complaint_invalid(uuid, text) from public;
grant execute on function public.admin_mark_complaint_invalid(uuid, text) to authenticated;

notify pgrst, 'reload schema';
