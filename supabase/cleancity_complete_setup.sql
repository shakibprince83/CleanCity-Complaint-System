-- CleanCity complete Supabase setup
-- Generated from the ordered migration history on 30 September 2026.
--
-- USE THIS FILE ONLY FOR A NEW/EMPTY SUPABASE PROJECT.
-- For an existing project, continue using the timestamped files in migrations/
-- so Supabase migration history remains valid.
--
-- This file preserves the same execution order and final database behaviour.

-- ============================================================================
-- Source migration: 202609110001_create_citizen_profiles.sql
-- ============================================================================

-- Citizen profile schema, automatic provisioning and row-level access controls.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 30),
  residential_address text not null check (char_length(residential_address) between 5 and 250),
  nid_last4 text check (nid_last4 is null or nid_last4 ~ '^[0-9]{4}$'),
  nid_verified boolean not null default false,
  role text not null default 'citizen' check (role in ('citizen', 'volunteer', 'admin')),
  account_status text not null default 'active' check (account_status in ('active', 'inactive', 'suspended')),
  preferred_language text not null default 'English' check (preferred_language in ('English', 'বাংলা')),
  notification_enabled boolean not null default true,
  avatar_url text,
  trust_score integer not null default 86 check (trust_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    residential_address,
    nid_last4
  )
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'CleanCity Citizen'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 'Not provided'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'residential_address'), ''), 'Not provided'),
    nullif(right(regexp_replace(coalesce(new.raw_user_meta_data ->> 'nid_last4', ''), '[^0-9]', '', 'g'), 4), '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop policy if exists "Citizens can read their own profile" on public.profiles;
create policy "Citizens can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Citizens can update their own profile" on public.profiles;
create policy "Citizens can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (
  full_name,
  phone,
  residential_address,
  preferred_language,
  notification_enabled,
  avatar_url
) on table public.profiles to authenticated;


-- ============================================================================
-- Source migration: 202609120001_create_citizen_dashboard_data.sql
-- ============================================================================

-- Citizen-owned complaints and notifications used by the live dashboard.
create extension if not exists pgcrypto;
create sequence if not exists public.complaint_reference_seq start 24103;

-- Keep this migration runnable even when the profile migration was not applied first.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('CC-' || nextval('public.complaint_reference_seq')),
  citizen_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 5 and 150),
  description text not null check (char_length(description) between 10 and 500),
  category text not null check (category in ('Waste', 'Waterlogging', 'Emergency')),
  location text not null check (char_length(location) between 3 and 250),
  latitude double precision,
  longitude double precision,
  status text not null default 'Pending' check (status in ('Pending', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected')),
  priority text not null default 'Normal' check (priority in ('Normal', 'Medium', 'High', 'Urgent')),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references auth.users (id) on delete cascade,
  complaint_id uuid references public.complaints (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  message text not null check (char_length(message) between 2 and 300),
  tone text not null default 'green' check (tone in ('green', 'blue', 'gold', 'red')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists complaints_citizen_created_idx on public.complaints (citizen_id, created_at desc);
create index if not exists notifications_citizen_created_idx on public.notifications (citizen_id, created_at desc);
alter table public.complaints enable row level security;
alter table public.notifications enable row level security;

drop trigger if exists set_complaints_updated_at on public.complaints;
create trigger set_complaints_updated_at before update on public.complaints
for each row execute procedure public.set_updated_at();

create or replace function public.notify_new_complaint()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (citizen_id, complaint_id, title, message, tone)
  values (new.citizen_id, new.id, 'Complaint submitted', new.reference || ' was submitted successfully.', 'green');
  return new;
end;
$$;
drop trigger if exists on_complaint_created on public.complaints;
create trigger on_complaint_created after insert on public.complaints
for each row execute procedure public.notify_new_complaint();

drop policy if exists "Citizens can read their complaints" on public.complaints;
create policy "Citizens can read their complaints" on public.complaints for select to authenticated using ((select auth.uid()) = citizen_id);
drop policy if exists "Citizens can create their complaints" on public.complaints;
create policy "Citizens can create their complaints" on public.complaints for insert to authenticated with check ((select auth.uid()) = citizen_id);
drop policy if exists "Citizens can read their notifications" on public.notifications;
create policy "Citizens can read their notifications" on public.notifications for select to authenticated using ((select auth.uid()) = citizen_id);
drop policy if exists "Citizens can mark their notifications read" on public.notifications;
create policy "Citizens can mark their notifications read" on public.notifications for update to authenticated using ((select auth.uid()) = citizen_id) with check ((select auth.uid()) = citizen_id);

revoke all on table public.complaints from anon, authenticated;
revoke all on table public.notifications from anon, authenticated;
grant select, insert on table public.complaints to authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;
grant usage, select on sequence public.complaint_reference_seq to authenticated;

-- Ask Supabase PostgREST to discover the new tables immediately.
notify pgrst, 'reload schema';


-- ============================================================================
-- Source migration: 202609120002_enforce_unique_citizen_nid.sql
-- ============================================================================

-- Enforce unique citizen NIDs without storing or exposing the full NID number.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.nid_registry (
  user_id uuid primary key references auth.users (id) on delete cascade,
  fingerprint text not null unique check (fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);

alter table private.nid_registry enable row level security;
revoke all on table private.nid_registry from public, anon, authenticated;

create or replace function public.nid_is_available(candidate_fingerprint text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    candidate_fingerprint ~ '^[a-f0-9]{64}$'
    and not exists (
      select 1
      from private.nid_registry
      where fingerprint = candidate_fingerprint
    );
$$;

revoke all on function public.nid_is_available(text) from public;
grant execute on function public.nid_is_available(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitted_fingerprint text;
begin
  submitted_fingerprint := nullif(
    trim(new.raw_user_meta_data ->> 'nid_fingerprint'),
    ''
  );

  if submitted_fingerprint is null
    or submitted_fingerprint !~ '^[a-f0-9]{64}$' then
    raise exception 'A valid NID fingerprint is required.';
  end if;

  insert into private.nid_registry (user_id, fingerprint)
  values (new.id, submitted_fingerprint);

  insert into public.profiles (
    id,
    full_name,
    phone,
    residential_address,
    nid_last4
  )
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'CleanCity Citizen'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 'Not provided'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'residential_address'), ''), 'Not provided'),
    nullif(right(regexp_replace(coalesce(new.raw_user_meta_data ->> 'nid_last4', ''), '[^0-9]', '', 'g'), 4), '')
  );

  return new;
exception
  when unique_violation then
    raise exception 'This NID is already registered.';
end;
$$;

notify pgrst, 'reload schema';


-- ============================================================================
-- Source migration: 202609140001_add_complaint_evidence_storage.sql
-- ============================================================================

-- Store complaint images in a private Supabase Storage bucket.
alter table public.complaints
  add column if not exists image_path text
  check (image_path is null or char_length(image_path) between 40 and 300);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-evidence',
  'complaint-evidence',
  false,
  8388608,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Citizens can upload their complaint evidence" on storage.objects;
create policy "Citizens can upload their complaint evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'complaint-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Citizens can read their complaint evidence" on storage.objects;
create policy "Citizens can read their complaint evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'complaint-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Citizens can delete their complaint evidence" on storage.objects;
create policy "Citizens can delete their complaint evidence"
on storage.objects for delete to authenticated
using (
  bucket_id = 'complaint-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

notify pgrst, 'reload schema';


-- ============================================================================
-- Source migration: 202609240001_add_secure_admin_backend.sql
-- ============================================================================

-- Secure administrator access and database-backed administration features.

alter table public.profiles
  add column if not exists email text,
  add column if not exists department text not null default 'City Operations',
  add column if not exists admin_title text not null default 'System Administrator';

update public.profiles as profile
set email = lower(auth_user.email)
from auth.users as auth_user
where profile.id = auth_user.id and profile.email is null;

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email)) where email is not null;

alter table public.complaints
  add column if not exists assigned_team text,
  add column if not exists admin_notes text;

create table if not exists public.admin_invites (
  email text primary key check (email = lower(email)),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

alter table public.admin_invites enable row level security;

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.profiles
    where id = check_user_id
      and role = 'admin'
      and account_status = 'active'
  );
$function$;

create or replace function public.admin_invite_is_valid(candidate_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.admin_invites
    where email = lower(trim(candidate_email)) and used_at is null
  );
$function$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  submitted_fingerprint text;
  requested_role text := lower(coalesce(new.raw_user_meta_data ->> 'requested_role', 'citizen'));
  assigned_role text := 'citizen';
begin
  submitted_fingerprint := nullif(trim(new.raw_user_meta_data ->> 'nid_fingerprint'), '');
  if submitted_fingerprint is null or submitted_fingerprint !~ '^[a-f0-9]{64}$' then
    raise exception 'A valid NID fingerprint is required.';
  end if;

  insert into private.nid_registry (user_id, fingerprint)
  values (new.id, submitted_fingerprint);

  if requested_role = 'admin' and exists (
    select 1 from public.admin_invites
    where email = lower(new.email) and used_at is null
  ) then
    assigned_role := 'admin';
    update public.admin_invites
    set used_at = now()
    where email = lower(new.email) and used_at is null;
  end if;

  insert into public.profiles (
    id, email, full_name, phone, residential_address,
    nid_last4, role, nid_verified
  ) values (
    new.id,
    lower(new.email),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'CleanCity Citizen'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 'Not provided'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'residential_address'), ''), 'Not provided'),
    nullif(right(regexp_replace(coalesce(new.raw_user_meta_data ->> 'nid_last4', ''), '[^0-9]', '', 'g'), 4), ''),
    assigned_role,
    assigned_role = 'admin'
  );

  return new;
exception
  when unique_violation then
    raise exception 'This NID or email is already registered.';
end;
$function$;

drop policy if exists "Administrators can read all profiles" on public.profiles;
create policy "Administrators can read all profiles"
  on public.profiles for select to authenticated using (public.is_admin());

drop policy if exists "Administrators can read all complaints" on public.complaints;
create policy "Administrators can read all complaints"
  on public.complaints for select to authenticated using (public.is_admin());

drop policy if exists "Administrators can update complaints" on public.complaints;
create policy "Administrators can update complaints"
  on public.complaints for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Administrators can manage invitations" on public.admin_invites;
create policy "Administrators can manage invitations"
  on public.admin_invites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update on public.admin_invites to authenticated;
grant update (department, admin_title) on public.profiles to authenticated;
grant update (status, priority, assigned_team, admin_notes, resolved_at)
  on public.complaints to authenticated;

drop policy if exists "Administrators can read complaint evidence" on storage.objects;
create policy "Administrators can read complaint evidence"
  on storage.objects for select to authenticated
  using (bucket_id = 'complaint-evidence' and public.is_admin());

create or replace function public.admin_update_user(
  target_user_id uuid,
  new_role text,
  new_status text,
  new_nid_verified boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $function$
declare
  updated_profile public.profiles;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Administrator access required';
  end if;
  if new_role not in ('citizen', 'volunteer', 'admin') then
    raise exception 'Invalid user role';
  end if;
  if new_status not in ('active', 'inactive', 'suspended') then
    raise exception 'Invalid account status';
  end if;
  if target_user_id = auth.uid() and (new_role <> 'admin' or new_status <> 'active') then
    raise exception 'You cannot remove your own administrator access';
  end if;

  update public.profiles
  set role = new_role,
      account_status = new_status,
      nid_verified = new_nid_verified
  where id = target_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'User profile not found';
  end if;
  return updated_profile;
end;
$function$;

revoke all on function public.admin_update_user(uuid, text, text, boolean) from public;
grant execute on function public.admin_update_user(uuid, text, text, boolean) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.admin_invite_is_valid(text) to anon, authenticated;

create or replace function public.notify_complaint_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (citizen_id, complaint_id, title, message, tone)
    values (
      new.citizen_id,
      new.id,
      'Complaint status updated',
      new.reference || ' is now ' || lower(new.status) || '.',
      case
        when new.status = 'Resolved' then 'green'
        when new.status in ('Assigned', 'In Progress') then 'blue'
        when new.status = 'Rejected' then 'red'
        else 'gold'
      end
    );
  end if;
  return new;
end;
$function$;

drop trigger if exists on_complaint_status_changed on public.complaints;
create trigger on_complaint_status_changed
  after update of status on public.complaints
  for each row execute procedure public.notify_complaint_status_change();

notify pgrst, 'reload schema';


-- ============================================================================
-- Source migration: 202609240002_add_admin_workflows.sql
-- ============================================================================

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


-- ============================================================================
-- Source migration: 202609250001_update_invalid_review.sql
-- ============================================================================

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


-- ============================================================================
-- Source migration: 202609250002_add_admin_user_deletion.sql
-- ============================================================================

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


-- ============================================================================
-- Source migration: 202609250004_repair_trust_penalty_notification.sql
-- ============================================================================

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


-- ============================================================================
-- Source migration: 202609250005_add_admin_activity_notifications.sql
-- ============================================================================

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


-- ============================================================================
-- Source migration: 202609250008_preserve_registered_email_case.sql
-- ============================================================================

-- Preserve the exact email casing supplied during registration.
-- Supabase Auth treats email addresses case-insensitively, so the profile keeps
-- the original spelling and the application verifies it after authentication.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  submitted_fingerprint text;
  requested_role text := lower(coalesce(new.raw_user_meta_data ->> 'requested_role', 'citizen'));
  registered_email text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'registered_email'), ''),
    new.email
  );
  assigned_role text := 'citizen';
begin
  submitted_fingerprint := nullif(trim(new.raw_user_meta_data ->> 'nid_fingerprint'), '');
  if submitted_fingerprint is null or submitted_fingerprint !~ '^[a-f0-9]{64}$' then
    raise exception 'A valid NID fingerprint is required.';
  end if;

  insert into private.nid_registry (user_id, fingerprint)
  values (new.id, submitted_fingerprint);

  if requested_role = 'admin' and exists (
    select 1 from public.admin_invites
    where email = lower(new.email) and used_at is null
  ) then
    assigned_role := 'admin';
    update public.admin_invites
    set used_at = now()
    where email = lower(new.email) and used_at is null;
  end if;

  insert into public.profiles (
    id, email, full_name, phone, residential_address,
    nid_last4, role, nid_verified
  ) values (
    new.id,
    registered_email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'CleanCity Citizen'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 'Not provided'),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'residential_address'), ''), 'Not provided'),
    nullif(right(regexp_replace(coalesce(new.raw_user_meta_data ->> 'nid_last4', ''), '[^0-9]', '', 'g'), 4), ''),
    assigned_role,
    assigned_role = 'admin'
  );

  return new;
exception
  when unique_violation then
    raise exception 'This NID or email is already registered.';
end;
$function$;


-- ============================================================================
-- Source migration: 202609300001_invalid_review_decreases_trust_score.sql
-- ============================================================================

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

  get diagnostics penalty_rows = row_count;

  if penalty_rows = 1 then
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


-- ============================================================================
-- Source migration: 202609300002_apply_invalid_penalty_to_all_citizens.sql
-- ============================================================================

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


-- ============================================================================
-- Source migration: 202609300003_repair_all_citizen_trust_scores.sql
-- ============================================================================

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

