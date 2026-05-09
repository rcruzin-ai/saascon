-- Add a stored generated column `name_lower` so Supabase clients can do
-- `.upsert(..., { onConflict: 'name_lower' })` without a custom function.
-- The existing unique index on `lower(name)` is functional only — the
-- supabase-js .upsert() builder needs a column it can name as the
-- conflict target.
--
-- The new column is generated, so the app does not write to it; it
-- always equals lower(name). The old expression index can stay (cheap,
-- backs both the generated column lookup and any direct lower(name)
-- queries from raw SQL).

alter table foods
  add column name_lower text generated always as (lower(name)) stored;

create unique index if not exists foods_name_lower_col_idx on foods (name_lower);
