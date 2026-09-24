-- Persistent admin workflows for identity, validity, authority reports and trust penalties.
create table if not exists public.authority_reports (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  authority text not null,
  subject text not null check (char_length(trim(subject)) > 0),
  details text not null check (char_length(trim(details)) > 0),
  response_deadline date,
  priority text not null default 'Normal' check (priority in ('Normal', 'High', 'Urgent')),
  status text not null default 'Draft' check (status in ('Draft', 'Sent')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.complaint_reviews (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  reviewed_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  decision text not null check (decision in ('Valid', 'Invalid')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.trust_penalties (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.profiles(id) on delete cascade,
  complaint_id uuid not null unique references public.complaints(id) on delete cascade,
  applied_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  points integer not null check (points between 1 and 100),
  reason text not null check (char_length(trim(reason)) > 0),
  created_at timestamptz not null default now()
);

drop trigger if exists set_authority_reports_updated_at on public.authority_reports;
create trigger set_authority_reports_updated_at
before update on public.authority_reports
for each row execute function public.set_updated_at();

alter table public.authority_reports enable row level security;
alter table public.complaint_reviews enable row level security;
alter table public.trust_penalties enable row level security;

drop policy if exists "Active admins manage authority reports" on public.authority_reports;
create policy "Active admins manage authority reports" on public.authority_reports
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Active admins manage complaint reviews" on public.complaint_reviews;
create policy "Active admins manage complaint reviews" on public.complaint_reviews
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Active admins manage trust penalties" on public.trust_penalties;
create policy "Active admins manage trust penalties" on public.trust_penalties
for all to authenticated using (public.is_admin()) with check (public.is_admin());

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

  insert into public.complaint_reviews (complaint_id, reviewed_by, decision, notes)
  values (target_complaint_id, auth.uid(), review_decision, review_notes);

  if review_decision = 'Valid' then
    update public.complaints
    set status = case when status = 'Pending' then 'Under Review' else status end,
        updated_at = now()
    where id = target_complaint_id;
  end if;
end;
$$;

create or replace function public.admin_apply_trust_penalty(
  target_complaint_id uuid,
  deduction integer,
  penalty_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_citizen_id uuid;
  new_score integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if deduction < 1 or deduction > 100 then
    raise exception 'Deduction must be between 1 and 100';
  end if;
  if char_length(trim(penalty_reason)) = 0 then
    raise exception 'A penalty reason is required';
  end if;

  select citizen_id into target_citizen_id
  from public.complaints
  where id = target_complaint_id
  for update;

  if target_citizen_id is null then
    raise exception 'Complaint not found';
  end if;

  insert into public.complaint_reviews (complaint_id, reviewed_by, decision, notes)
  values (target_complaint_id, auth.uid(), 'Invalid', penalty_reason);

  insert into public.trust_penalties (citizen_id, complaint_id, applied_by, points, reason)
  values (target_citizen_id, target_complaint_id, auth.uid(), deduction, penalty_reason);

  update public.profiles
  set trust_score = greatest(0, coalesce(trust_score, 0) - deduction),
      updated_at = now()
  where id = target_citizen_id
  returning trust_score into new_score;

  update public.complaints
  set status = 'Rejected', updated_at = now()
  where id = target_complaint_id;

  insert into public.notifications (citizen_id, complaint_id, title, message, is_read)
  values (target_citizen_id, target_complaint_id, 'Trust score updated',
    'An administrator applied a ' || deduction || '-point deduction after reviewing this complaint.', false);

  return new_score;
exception
  when unique_violation then
    raise exception 'A trust penalty has already been applied to this complaint';
end;
$$;

revoke all on function public.admin_review_complaint(uuid, text, text) from public;
revoke all on function public.admin_apply_trust_penalty(uuid, integer, text) from public;
grant execute on function public.admin_review_complaint(uuid, text, text) to authenticated;
grant execute on function public.admin_apply_trust_penalty(uuid, integer, text) to authenticated;
grant select, insert, update on public.authority_reports to authenticated;
grant select, insert on public.complaint_reviews to authenticated;
grant select, insert on public.trust_penalties to authenticated;

notify pgrst, 'reload schema';
