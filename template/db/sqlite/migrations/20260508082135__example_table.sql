-- SQLite-dialect mirror of db/migrations/20260508082135__example_table.sql.
-- Same table, same indexes, no RLS (SQLite doesn't support it).

create table if not exists examples (
  id          text primary key,
  label       text not null check (length(label) between 1 and 200),
  created_at  text not null default (datetime('now'))
);

create index if not exists examples_created_at_idx on examples (created_at desc);
