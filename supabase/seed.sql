-- Local starter seed for Supabase CLI development.
-- This file runs automatically on `supabase db reset` because `supabase/config.toml`
-- already enables `[db.seed]` and points to `./seed.sql`.
--
-- PINs are six digits here because the local Supabase auth config defaults to a minimum
-- password length of 6. The app still presents them as user PINs.

do $$
begin
  if not exists (
    select 1
    from pg_extension
    where extname = 'pgcrypto'
  ) then
    create extension if not exists pgcrypto with schema extensions;
  end if;
end $$;

with department_seed (id, name, slug, description) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'Coordinator', 'coordinator', 'Planning and coordination lane'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'Production', 'production', 'Main production floor'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'Quality Control', 'quality-control', 'Inspection and release lane'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'VP Shipping', 'vp-shipping', 'Final ship and pack-out lane'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'Operational Support', 'operational-support', 'Cross-functional support lane')
)
insert into public.departments (id, name, slug, description)
select id, name, slug, description
from department_seed
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  is_active = true;

with user_seed (id, display_name, email, pin, default_department_slug) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'Zach Filkins', 'zach.filkins@plasticprinters.com', '104821', 'coordinator'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'Sean Jones', 'sean.jones@plasticprinters.com', '104822', 'production'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Mel Mezo-Stensland', 'mel.mezo-stensland@plasticprinters.com', '104823', 'quality-control'),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'Austin Novalany', 'austin.novalany@plasticprinters.com', '104824', 'production'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'Olivia Lynna White', 'olivia.lynna.white@plasticprinters.com', '104825', 'coordinator'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'Gloribee Acevedo', 'gloribee.acevedo@plasticprinters.com', '104826', 'vp-shipping'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'James Mischler', 'james.mischler@plasticprinters.com', '104827', 'production'),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'Jessica Gerlach', 'jessica.gerlach@plasticprinters.com', '104828', 'coordinator'),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'Bob Garey', 'bob.garey@plasticprinters.com', '104829', 'production'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'Ethan Feldman', 'ethan.feldman@plasticprinters.com', '104830', 'production'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'Andy VonBargen', 'andy.vonbargen@plasticprinters.com', '104831', 'production'),
    ('20000000-0000-4000-8000-000000000012'::uuid, 'Jessica Schuster', 'jessica.schuster@plasticprinters.com', '104832', 'quality-control'),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'QC Support User', 'qc.support.user@plasticprinters.com', '104833', 'quality-control'),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'OpSupp', 'opsupp@plasticprinters.com', '104834', 'operational-support')
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  email,
  crypt(pin, gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', display_name),
  now(),
  now(),
  false,
  false
from user_seed
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at,
  is_sso_user = excluded.is_sso_user,
  is_anonymous = excluded.is_anonymous;

with user_seed (id, display_name, email) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'Zach Filkins', 'zach.filkins@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'Sean Jones', 'sean.jones@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Mel Mezo-Stensland', 'mel.mezo-stensland@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'Austin Novalany', 'austin.novalany@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'Olivia Lynna White', 'olivia.lynna.white@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'Gloribee Acevedo', 'gloribee.acevedo@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'James Mischler', 'james.mischler@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'Jessica Gerlach', 'jessica.gerlach@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'Bob Garey', 'bob.garey@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'Ethan Feldman', 'ethan.feldman@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'Andy VonBargen', 'andy.vonbargen@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000012'::uuid, 'Jessica Schuster', 'jessica.schuster@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'QC Support User', 'qc.support.user@plasticprinters.com'),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'OpSupp', 'opsupp@plasticprinters.com')
)
insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id,
  email,
  id,
  jsonb_build_object(
    'sub', id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
from user_seed
on conflict (id) do update
set
  provider_id = excluded.provider_id,
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  provider = excluded.provider,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = excluded.updated_at;

with user_seed (id, display_name, email, default_department_slug) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'Zach Filkins', 'zach.filkins@plasticprinters.com', 'coordinator'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'Sean Jones', 'sean.jones@plasticprinters.com', 'production'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Mel Mezo-Stensland', 'mel.mezo-stensland@plasticprinters.com', 'quality-control'),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'Austin Novalany', 'austin.novalany@plasticprinters.com', 'production'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'Olivia Lynna White', 'olivia.lynna.white@plasticprinters.com', 'coordinator'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'Gloribee Acevedo', 'gloribee.acevedo@plasticprinters.com', 'vp-shipping'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'James Mischler', 'james.mischler@plasticprinters.com', 'production'),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'Jessica Gerlach', 'jessica.gerlach@plasticprinters.com', 'coordinator'),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'Bob Garey', 'bob.garey@plasticprinters.com', 'production'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'Ethan Feldman', 'ethan.feldman@plasticprinters.com', 'production'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'Andy VonBargen', 'andy.vonbargen@plasticprinters.com', 'production'),
    ('20000000-0000-4000-8000-000000000012'::uuid, 'Jessica Schuster', 'jessica.schuster@plasticprinters.com', 'quality-control'),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'QC Support User', 'qc.support.user@plasticprinters.com', 'quality-control'),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'OpSupp', 'opsupp@plasticprinters.com', 'operational-support')
)
insert into public.users (id, email, display_name, default_department_id)
select
  user_seed.id,
  user_seed.email,
  user_seed.display_name,
  departments.id
from user_seed
join public.departments
  on departments.slug = user_seed.default_department_slug
on conflict (id) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  default_department_id = excluded.default_department_id,
  is_active = true;

with membership_seed (user_id, department_slug) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'coordinator'),
    ('20000000-0000-4000-8000-000000000001'::uuid, 'production'),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'production'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'quality-control'),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'operational-support'),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'production'),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'operational-support'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'coordinator'),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'vp-shipping'),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'vp-shipping'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'production'),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'quality-control'),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'coordinator'),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'operational-support'),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'production'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'production'),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'vp-shipping'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'production'),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'operational-support'),
    ('20000000-0000-4000-8000-000000000012'::uuid, 'quality-control'),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'quality-control'),
    ('20000000-0000-4000-8000-000000000013'::uuid, 'operational-support'),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'operational-support'),
    ('20000000-0000-4000-8000-000000000014'::uuid, 'coordinator')
)
insert into public.user_departments (user_id, department_id)
select
  membership_seed.user_id,
  departments.id
from membership_seed
join public.departments
  on departments.slug = membership_seed.department_slug
on conflict (user_id, department_id) do nothing;

-- Quick reference for local login:
-- Zach Filkins             zach.filkins@plasticprinters.com           PIN 104821
-- Sean Jones               sean.jones@plasticprinters.com             PIN 104822
-- Mel Mezo-Stensland       mel.mezo-stensland@plasticprinters.com     PIN 104823
-- Austin Novalany          austin.novalany@plasticprinters.com        PIN 104824
-- Olivia Lynna White       olivia.lynna.white@plasticprinters.com     PIN 104825
-- Gloribee Acevedo         gloribee.acevedo@plasticprinters.com       PIN 104826
-- James Mischler           james.mischler@plasticprinters.com         PIN 104827
-- Jessica Gerlach          jessica.gerlach@plasticprinters.com        PIN 104828
-- Bob Garey                bob.garey@plasticprinters.com              PIN 104829
-- Ethan Feldman            ethan.feldman@plasticprinters.com          PIN 104830
-- Andy VonBargen           andy.vonbargen@plasticprinters.com         PIN 104831
-- Jessica Schuster         jessica.schuster@plasticprinters.com       PIN 104832
-- QC Support User          qc.support.user@plasticprinters.com        PIN 104833
-- OpSupp                   opsupp@plasticprinters.com                 PIN 104834
