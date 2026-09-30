-- Repair penalty records that exist without a matching trust-score deduction.
-- All citizen profiles start at 86 and trust_penalties is the only score deduction ledger.
alter table public.trust_penalties
  add column if not exists score_applied boolean not null default false;

-- Bring every affected citizen to the score represented by their penalty ledger.
-- LEAST preserves any score that is already lower, so this never restores points.
with penalty_totals as (
  select citizen_id, sum(points)::integer as deducted_points
  from public.trust_penalties
  group by citizen_id
)
update public.profiles as profile
set trust_score = least(
      profile.trust_score,
      greatest(0, 86 - penalty_totals.deducted_points)
    ),
    updated_at = now()
from penalty_totals
where profile.id = penalty_totals.citizen_id;

update public.trust_penalties
set score_applied = true
where not score_applied;

-- Make the penalty row the single source of truth. Any future insertion through
-- any admin workflow deducts points from that complaint's actual owner.
create or replace function public.apply_trust_penalty_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.score_applied then
    return new;
  end if;

  update public.profiles
  set trust_score = greatest(0, coalesce(trust_score, 0) - new.points),
      updated_at = now()
  where id = new.citizen_id;

  if not found then
    raise exception 'Citizen profile not found';
  end if;

  new.score_applied := true;
  return new;
end;
$$;

drop trigger if exists apply_trust_penalty_score on public.trust_penalties;
create trigger apply_trust_penalty_score
before insert on public.trust_penalties
for each row execute function public.apply_trust_penalty_score();

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
  updated_trust_score integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  select complaint.citizen_id
  into target_citizen_id
  from public.complaints as complaint
  where complaint.id = target_complaint_id
  for update;

  if target_citizen_id is null then
    raise exception 'Complaint not found or has no citizen owner';
  end if;

  insert into public.complaint_reviews (
    complaint_id, reviewed_by, decision, notes
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
    citizen_id, complaint_id, applied_by, points, reason
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

  select trust_score
  into updated_trust_score
  from public.profiles
  where id = target_citizen_id;

  update public.complaints
  set status = 'Rejected',
      updated_at = now()
  where id = target_complaint_id;

  if not exists (
    select 1
    from public.notifications
    where citizen_id = target_citizen_id
      and complaint_id = target_complaint_id
      and title = 'Trust score decreased'
  ) then
    insert into public.notifications (
      citizen_id, complaint_id, title, message, tone
    )
    values (
      target_citizen_id,
      target_complaint_id,
      'Trust score decreased',
      'Your complaint was marked invalid and 10 trust points were deducted.',
      'red'
    );
  end if;

  return updated_trust_score;
end;
$$;

-- Keep the older point-degradation screen compatible with the same central logic.
create or replace function public.admin_apply_trust_penalty(
  target_complaint_id uuid,
  penalty_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if penalty_reason is null or char_length(trim(penalty_reason)) = 0 then
    raise exception 'A penalty reason is required';
  end if;

  return public.admin_mark_complaint_invalid(
    target_complaint_id,
    penalty_reason
  );
end;
$$;

revoke all on function public.apply_trust_penalty_score() from public;
revoke all on function public.admin_mark_complaint_invalid(uuid, text) from public;
revoke all on function public.admin_apply_trust_penalty(uuid, text) from public;
grant execute on function public.admin_mark_complaint_invalid(uuid, text) to authenticated;
grant execute on function public.admin_apply_trust_penalty(uuid, text) to authenticated;

notify pgrst, 'reload schema';
