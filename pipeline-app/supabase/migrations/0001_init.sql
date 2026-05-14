-- pipeline-app initial schema (DL #017)
--
-- Run against a fresh Supabase project. Idempotent within reason — uses IF NOT
-- EXISTS where Postgres supports it. Apply via:
--   supabase db push                    # CLI
--   or paste into Supabase SQL editor
--
-- Auth: relies on Supabase auth.users. RLS is enabled on every table; the
-- default policy is "authenticated role may do anything". Tighten later.

set search_path = public;

-- ============================================================================
-- Clients (companies / customers owning one or more tenants)
-- ============================================================================
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- ============================================================================
-- Seeds (the artifacts applied to a tenant — replaces labor-factory-seeds repo)
-- ============================================================================
create table if not exists seeds (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  origin jsonb not null default '{"kind":"manual"}'::jsonb,
  core_version text not null,
  payload jsonb not null,
  suggested_tenants jsonb not null default '[]'::jsonb,
  thumbnail_path text,
  client_id uuid references clients(id) on delete set null,
  immutable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  last_used_at timestamptz
);
create index if not exists seeds_status_idx on seeds(status);
create index if not exists seeds_client_idx on seeds(client_id);

-- Auto-touch updated_at
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists seeds_touch_updated_at on seeds;
create trigger seeds_touch_updated_at
  before update on seeds
  for each row execute function touch_updated_at();

-- ============================================================================
-- Seed audit log (replaces git history for seed changes)
-- ============================================================================
create table if not exists seed_audits (
  id bigserial primary key,
  seed_id uuid references seeds(id) on delete cascade,
  at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('create','update','publish','archive','delete')),
  before jsonb,
  after jsonb
);
create index if not exists seed_audits_seed_idx on seed_audits(seed_id, at desc);

-- ============================================================================
-- Applied seeds (what is running where — replaces local SQLite lastAppliedTo)
-- ============================================================================
create table if not exists applied_seeds (
  id uuid primary key default gen_random_uuid(),
  environment text not null check (environment in ('local','staging','prod')),
  project_name text,
  tenant_slug text,
  seed_id uuid references seeds(id) on delete set null,
  active_components text[] not null default '{}',
  active_record_types text[] not null default '{}',
  settings jsonb not null default '{}'::jsonb,
  factory_core_version text,
  applied_at timestamptz not null default now(),
  applied_by uuid references auth.users(id) on delete set null
);
create unique index if not exists applied_seeds_local_uq
  on applied_seeds(environment, project_name)
  where environment = 'local';
create unique index if not exists applied_seeds_remote_uq
  on applied_seeds(environment, tenant_slug)
  where environment in ('staging','prod');

-- ============================================================================
-- Team defaults (singleton — bitbucket/fly settings that used to be form fields)
-- ============================================================================
create table if not exists team_defaults (
  id uuid primary key default gen_random_uuid(),
  bitbucket_workspace text not null default '',
  bitbucket_project_key text not null default '',
  fly_org_slug text not null default 'personal',
  fly_region text not null default 'fra',
  fly_machine_size text not null default 'shared-cpu-1x-512',
  staging_api_base_url text not null default '',
  updated_at timestamptz not null default now()
);

drop trigger if exists team_defaults_touch_updated_at on team_defaults;
create trigger team_defaults_touch_updated_at
  before update on team_defaults
  for each row execute function touch_updated_at();

-- Seed a single row so the UI never has to handle the empty case.
insert into team_defaults default values
on conflict do nothing;

-- ============================================================================
-- Row-level security
-- ============================================================================
alter table clients         enable row level security;
alter table seeds           enable row level security;
alter table seed_audits     enable row level security;
alter table applied_seeds   enable row level security;
alter table team_defaults   enable row level security;

-- Permissive policies for `authenticated` role; service_role bypasses RLS by design.
do $$ begin
  if not exists (select 1 from pg_policies where tablename='clients' and policyname='clients_all_auth') then
    create policy clients_all_auth on clients for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='seeds' and policyname='seeds_all_auth') then
    create policy seeds_all_auth on seeds for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='seed_audits' and policyname='seed_audits_all_auth') then
    create policy seed_audits_all_auth on seed_audits for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='applied_seeds' and policyname='applied_seeds_all_auth') then
    create policy applied_seeds_all_auth on applied_seeds for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='team_defaults' and policyname='team_defaults_all_auth') then
    create policy team_defaults_all_auth on team_defaults for all to authenticated using (true) with check (true);
  end if;
end $$;
