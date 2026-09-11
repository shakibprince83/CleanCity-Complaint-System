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
