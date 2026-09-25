-- Administrator activity notifications with per-admin read state.
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  title text not null check (char_length(trim(title)) between 2 and 120),
  message text not null check (char_length(trim(message)) between 2 and 400),
  tone text not null default 'green' check (tone in ('green', 'blue', 'gold', 'red')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_notification_reads (
  notification_id uuid not null references public.admin_notifications(id) on delete cascade,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, admin_id)
);

create index if not exists admin_notifications_created_idx
on public.admin_notifications(created_at desc);

create index if not exists admin_notification_reads_admin_idx
on public.admin_notification_reads(admin_id, read_at desc);

alter table public.admin_notifications enable row level security;
alter table public.admin_notification_reads enable row level security;

drop policy if exists "Active admins read activity notifications" on public.admin_notifications;
create policy "Active admins read activity notifications"
on public.admin_notifications for select to authenticated
using (public.is_admin());

drop policy if exists "Active admins read own notification state" on public.admin_notification_reads;
create policy "Active admins read own notification state"
on public.admin_notification_reads for select to authenticated
using (public.is_admin() and admin_id = auth.uid());

drop policy if exists "Active admins create own notification state" on public.admin_notification_reads;
create policy "Active admins create own notification state"
on public.admin_notification_reads for insert to authenticated
with check (public.is_admin() and admin_id = auth.uid());

drop policy if exists "Active admins update own notification state" on public.admin_notification_reads;
create policy "Active admins update own notification state"
on public.admin_notification_reads for update to authenticated
using (public.is_admin() and admin_id = auth.uid())
with check (public.is_admin() and admin_id = auth.uid());

create or replace function public.add_admin_activity_notification(
  activity_action text,
  activity_entity_type text,
  activity_entity_id uuid,
  activity_title text,
  activity_message text,
  activity_tone text default 'green'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_notifications (
    actor_id,
    action_type,
    entity_type,
    entity_id,
    title,
    message,
    tone
  )
  values (
    auth.uid(),
    activity_action,
    activity_entity_type,
    activity_entity_id,
    activity_title,
    activity_message,
    activity_tone
  );
end;
$$;

create or replace function public.notify_admins_of_complaint_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.add_admin_activity_notification(
      'complaint_created',
      'complaint',
      new.id,
      'New complaint submitted',
      new.reference || ' · ' || new.title,
      'green'
    );
  elsif (
    old.status is distinct from new.status
    or old.priority is distinct from new.priority
    or old.assigned_team is distinct from new.assigned_team
  ) then
    perform public.add_admin_activity_notification(
      'complaint_updated',
      'complaint',
      new.id,
      'Complaint workflow updated',
      new.reference || ' is now ' || new.status ||
        case when new.assigned_team is not null then ' · ' || new.assigned_team else '' end,
      case when new.status = 'Rejected' then 'red'
           when new.status = 'Resolved' then 'green'
           else 'blue' end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_admins_complaint_activity on public.complaints;
create trigger notify_admins_complaint_activity
after insert or update on public.complaints
for each row execute function public.notify_admins_of_complaint_activity();

create or replace function public.notify_admins_of_profile_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.add_admin_activity_notification(
      'account_created',
      'profile',
      new.id,
      'New account registered',
      coalesce(new.full_name, new.email, 'A new user') || ' created an account.',
      'green'
    );
    return new;
  elsif tg_op = 'DELETE' then
    perform public.add_admin_activity_notification(
      'account_deleted',
      'profile',
      old.id,
      'Account deleted',
      coalesce(old.full_name, old.email, 'A user account') || ' was deleted.',
      'red'
    );
    return old;
  elsif (
    old.full_name is distinct from new.full_name
    or old.phone is distinct from new.phone
    or old.residential_address is distinct from new.residential_address
    or old.role is distinct from new.role
    or old.account_status is distinct from new.account_status
    or old.nid_verified is distinct from new.nid_verified
    or old.trust_score is distinct from new.trust_score
  ) then
    perform public.add_admin_activity_notification(
      'profile_updated',
      'profile',
      new.id,
      'User profile updated',
      coalesce(new.full_name, new.email, 'A user') || '''s profile or access details changed.',
      case when new.account_status = 'suspended' then 'red' else 'blue' end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_admins_profile_activity on public.profiles;
create trigger notify_admins_profile_activity
after insert or update or delete on public.profiles
for each row execute function public.notify_admins_of_profile_activity();

create or replace function public.notify_admins_of_review_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  complaint_reference text;
begin
  select reference into complaint_reference
  from public.complaints
  where id = new.complaint_id;

  perform public.add_admin_activity_notification(
    'complaint_reviewed',
    'complaint',
    new.complaint_id,
    'Complaint marked ' || lower(new.decision),
    coalesce(complaint_reference, 'A complaint') || ' received a validity decision.',
    case when new.decision = 'Invalid' then 'red' else 'green' end
  );
  return new;
end;
$$;

drop trigger if exists notify_admins_review_activity on public.complaint_reviews;
create trigger notify_admins_review_activity
after insert on public.complaint_reviews
for each row execute function public.notify_admins_of_review_activity();

create or replace function public.notify_admins_of_penalty_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.add_admin_activity_notification(
    'trust_penalty_applied',
    'complaint',
    new.complaint_id,
    'Trust-score penalty applied',
    new.points || ' points were deducted from a citizen trust score.',
    'red'
  );
  return new;
end;
$$;

drop trigger if exists notify_admins_penalty_activity on public.trust_penalties;
create trigger notify_admins_penalty_activity
after insert on public.trust_penalties
for each row execute function public.notify_admins_of_penalty_activity();

create or replace function public.notify_admins_of_authority_report_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.add_admin_activity_notification(
    case when tg_op = 'INSERT' then 'authority_report_created' else 'authority_report_updated' end,
    'complaint',
    new.complaint_id,
    case when new.status = 'Sent' then 'Authority report sent' else 'Authority report saved' end,
    new.subject || ' · ' || new.authority,
    case when new.status = 'Sent' then 'green' else 'gold' end
  );
  return new;
end;
$$;

drop trigger if exists notify_admins_authority_report_activity on public.authority_reports;
create trigger notify_admins_authority_report_activity
after insert or update on public.authority_reports
for each row execute function public.notify_admins_of_authority_report_activity();

revoke all on table public.admin_notifications from anon, authenticated;
revoke all on table public.admin_notification_reads from anon, authenticated;
grant select on table public.admin_notifications to authenticated;
grant select, insert, update on table public.admin_notification_reads to authenticated;

revoke all on function public.add_admin_activity_notification(text, text, uuid, text, text, text) from public;

notify pgrst, 'reload schema';
