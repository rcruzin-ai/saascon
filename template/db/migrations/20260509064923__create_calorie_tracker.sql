-- Calorie tracker — core schema. Postgres dialect (Supabase).
--
-- RLS enabled on every table with explicit anon read policies (saascon ships
-- no auth). Writes go through the app — no anon write policies in v1.

create extension if not exists "pgcrypto";

create table if not exists foods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) between 1 and 80),
  calories    integer not null check (calories between 0 and 10000),
  protein_g   numeric(6,2) check (protein_g is null or (protein_g between 0 and 1000)),
  carbs_g     numeric(6,2) check (carbs_g   is null or (carbs_g   between 0 and 1000)),
  fat_g       numeric(6,2) check (fat_g     is null or (fat_g     between 0 and 1000)),
  created_at  timestamptz not null default now()
);

create unique index if not exists foods_name_lower_idx on foods (lower(name));

alter table foods enable row level security;

create policy "anon read foods"
  on foods for select
  to anon
  using (true);

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

create index if not exists entries_logged_at_idx on entries (logged_at desc);

alter table entries enable row level security;

create policy "anon read entries"
  on entries for select
  to anon
  using (true);

create table if not exists settings (
  id                    integer primary key check (id = 1),
  daily_calorie_target  integer not null default 2000 check (daily_calorie_target between 500 and 10000)
);

insert into settings (id, daily_calorie_target) values (1, 2000)
  on conflict (id) do nothing;

alter table settings enable row level security;

create policy "anon read settings"
  on settings for select
  to anon
  using (true);
