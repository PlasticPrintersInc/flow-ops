create extension if not exists pgcrypto with schema extensions;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  default_department_id uuid references public.departments (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_departments (
  user_id uuid not null references public.users (id) on delete cascade,
  department_id uuid not null references public.departments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, department_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;

create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create index if not exists user_departments_department_id_idx on public.user_departments (department_id);
create index if not exists users_default_department_id_idx on public.users (default_department_id);

alter table public.departments enable row level security;
alter table public.users enable row level security;
alter table public.user_departments enable row level security;

drop policy if exists "Authenticated users can read active departments" on public.departments;
create policy "Authenticated users can read active departments"
on public.departments
for select
to authenticated
using (is_active = true);

drop policy if exists "Users can read their own user row" on public.users;
create policy "Users can read their own user row"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can read their own department memberships" on public.user_departments;
create policy "Users can read their own department memberships"
on public.user_departments
for select
to authenticated
using (auth.uid() = user_id);

comment on table public.departments is 'Available departments users can sign in with.';
comment on table public.users is 'App-facing user profiles mapped one-to-one with Supabase auth users.';
comment on table public.user_departments is 'Join table describing which departments each user may sign in with.';
