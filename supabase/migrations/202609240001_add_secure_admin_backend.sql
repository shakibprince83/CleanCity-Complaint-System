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
