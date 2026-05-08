-- Example placeholder migration — delete this when adding your real entities.
--
-- Demonstrates the saascon migration convention:
--   * timestamped filename: YYYYMMDDHHMMSS__<short_snake_name>.sql
--   * append-only (never edit a merged migration)
--   * RLS enabled with explicit anon policies (saascon ships no auth)

create extension if not exists "pgcrypto";

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

create index if not exists examples_created_at_idx on examples (created_at desc);
