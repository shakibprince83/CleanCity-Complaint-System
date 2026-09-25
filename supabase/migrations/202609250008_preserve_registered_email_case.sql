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
