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

-- Example placeholder. Replace with your real entities.
--
-- create table entity_a (
--   id          uuid primary key default gen_random_uuid(),
--   name        text not null check (length(name) between 1 and 200),
--   created_at  timestamptz not null default now()
-- );
--
-- alter table entity_a enable row level security;
--
-- create policy "anon read entity_a"
--   on entity_a for select
--   to anon
--   using (true);
--
-- create policy "anon insert entity_a"
--   on entity_a for insert
--   to anon
--   with check (true);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- create index entity_a_created_at_idx on entity_a (created_at desc);

-- ---------------------------------------------------------------------------
-- Functions / triggers
-- ---------------------------------------------------------------------------

-- (none yet)
