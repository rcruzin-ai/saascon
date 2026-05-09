-- {{ project-name }} — canonical schema
--
-- Source of truth for the database. Apply changes via timestamped files
-- in db/migrations/, then update this file to reflect the current state.
--
-- Conventions:
--   * Tables: snake_case, plural
--   * Primary keys: uuid default gen_random_uuid()
--   * Timestamps: timestamptz, default now()
--   * RLS: enabled on every table; policies declared inline below
--   * Public app (no auth): policies grant anon role explicitly

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Example placeholder table — replace with your real entities.
-- Mirrors db/migrations/20260508082135__example_table.sql.

create table if not exists examples (
  id          uuid primary key default gen_random_uuid(),
  label       text not null check (length(label) between 1 and 200),
  created_at  timestamptz not null default now()
);

alter table examples enable row level security;

create policy "anon read examples"
  on examples for select
  to anon
  using (true);

create policy "anon insert examples"
  on examples for insert
  to anon
  with check (true);

create policy "anon delete examples"
  on examples for delete
  to anon
  using (true);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists examples_created_at_idx on examples (created_at desc);

-- ---------------------------------------------------------------------------
-- Functions / triggers
-- ---------------------------------------------------------------------------

-- (none yet)
