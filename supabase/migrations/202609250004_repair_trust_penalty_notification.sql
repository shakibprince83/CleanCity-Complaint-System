-- Repair deployments where the earlier trust-penalty function used an invalid notification column.
-- Fix trust-score penalties: always subtract exactly 10 points atomically.
create or replace function public.admin_apply_trust_penalty(
  target_complaint_id uuid,
  penalty_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_citizen_id uuid;
  current_score integer;
  new_score integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if target_complaint_id is null then
    raise exception 'A complaint is required';
  end if;

  if penalty_reason is null or char_length(trim(penalty_reason)) = 0 then
    raise exception 'A penalty reason is required';
  end if;

  select c.citizen_id
  into target_citizen_id
  from public.complaints as c
  where c.id = target_complaint_id;

  if target_citizen_id is null then
    raise exception 'Complaint not found';
  end if;

  if not exists (
    select 1
    from public.complaint_reviews as review
    where review.complaint_id = target_complaint_id
      and review.decision = 'Invalid'
  ) then
    raise exception 'Confirm this complaint as invalid before applying a penalty';
  end if;

  if exists (
    select 1
    from public.trust_penalties as penalty
    where penalty.complaint_id = target_complaint_id
  ) then
    raise exception 'A trust penalty has already been applied to this complaint';
  end if;

  select profile.trust_score
  into current_score
  from public.profiles as profile
  where profile.id = target_citizen_id
  for update;

  if current_score is null then
    raise exception 'Citizen profile not found';
  end if;

  new_score := greatest(0, current_score - 10);

  update public.profiles
  set trust_score = new_score,
      updated_at = now()
  where id = target_citizen_id;

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
    trim(penalty_reason)
  );

  update public.complaints
  set status = 'Rejected',
      updated_at = now()
  where id = target_complaint_id;

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
    'Trust score updated',
    'An administrator applied a 10-point deduction after reviewing this complaint.',
    'red'
  );

  return new_score;
end;
$$;

revoke all on function public.admin_apply_trust_penalty(uuid, text) from public;
grant execute on function public.admin_apply_trust_penalty(uuid, text) to authenticated;

notify pgrst, 'reload schema';
