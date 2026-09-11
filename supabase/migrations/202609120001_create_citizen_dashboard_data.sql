-- Citizen-owned complaints and notifications used by the live dashboard.
create extension if not exists pgcrypto;
create sequence if not exists public.complaint_reference_seq start 24103;

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
