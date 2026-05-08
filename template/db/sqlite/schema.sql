-- saascon SQLite schema — local-only mode.
-- Mirror of db/schema.sql adapted for SQLite. Notable differences:
--   * No pgcrypto / gen_random_uuid()  → app generates UUIDs in-process
--   * No timestamptz                   → ISO-8601 strings in TEXT columns
--   * No RLS                           → SQLite has no row-level security
--   * No PostgREST anon role           → reads/writes go through the app

create table if not exists examples (
  id          text primary key,
  label       text not null check (length(label) between 1 and 200),
  created_at  text not null default (datetime('now'))
);

create index if not exists examples_created_at_idx on examples (created_at desc);
