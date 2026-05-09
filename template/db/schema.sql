-- Calorie tracker — canonical Postgres schema (Supabase mode).
--
-- Source of truth for cloud mode. Apply changes via timestamped files in
-- db/migrations/, then update this file to reflect the current state.
--
-- Conventions:
--   * Tables: snake_case, plural
--   * Primary keys: uuid default gen_random_uuid()
--   * Timestamps: timestamptz, default now()
--   * RLS: enabled on every table; policies declared inline below
--   * Public app (no auth): policies grant anon role explicitly
--   * Writes happen server-side through the app — no anon write policies

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists foods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) between 1 and 80),
  name_lower  text generated always as (lower(name)) stored,
  calories    integer not null check (calories between 0 and 10000),
  protein_g   numeric(6,2) check (protein_g is null or (protein_g between 0 and 1000)),
  carbs_g     numeric(6,2) check (carbs_g   is null or (carbs_g   between 0 and 1000)),
  fat_g       numeric(6,2) check (fat_g     is null or (fat_g     between 0 and 1000)),
  created_at  timestamptz not null default now()
);

alter table foods enable row level security;

create policy "anon read foods"
  on foods for select
  to anon
  using (true);

create policy "anon insert foods"
  on foods for insert
  to anon
  with check (true);

create policy "anon update foods"
  on foods for update
  to anon
  using (true)
  with check (true);

create table if not exists entries (
  id                 uuid primary key default gen_random_uuid(),
  food_id            uuid references foods(id) on delete set null,
  name_snapshot      text not null,
  calories_snapshot  integer not null,
  protein_snapshot   numeric(6,2),
  carbs_snapshot     numeric(6,2),
  fat_snapshot       numeric(6,2),
  logged_at          timestamptz not null default now()
);

alter table entries enable row level security;

create policy "anon read entries"
  on entries for select
  to anon
  using (true);

create policy "anon insert entries"
  on entries for insert
  to anon
  with check (true);

create policy "anon delete entries"
  on entries for delete
  to anon
  using (true);

create table if not exists settings (
  id                    integer primary key check (id = 1),
  daily_calorie_target  integer not null default 2000 check (daily_calorie_target between 500 and 10000)
);

alter table settings enable row level security;

create policy "anon read settings"
  on settings for select
  to anon
  using (true);

create policy "anon update settings"
  on settings for update
  to anon
  using (true)
  with check (true);

-- Singleton settings row — every fresh database starts with a 2000 kcal target.
insert into settings (id, daily_calorie_target) values (1, 2000)
  on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create unique index if not exists foods_name_lower_idx on foods (lower(name));
create unique index if not exists foods_name_lower_col_idx on foods (name_lower);
create index if not exists entries_logged_at_idx on entries (logged_at desc);

-- ---------------------------------------------------------------------------
-- Functions / triggers
-- ---------------------------------------------------------------------------

-- (none yet)
