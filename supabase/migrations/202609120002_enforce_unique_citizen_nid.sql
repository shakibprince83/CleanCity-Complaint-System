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
