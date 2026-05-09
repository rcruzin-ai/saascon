-- Intentionally empty. Sibling of the Postgres migration with the same
-- timestamp prefix. SQLite already has a working `unique index on lower(name)`
-- (see 20260509064923__create_calorie_tracker.sql) which backs the
-- `on conflict (lower(name)) do update` path. The generated column is
-- only needed for Supabase's @supabase/supabase-js .upsert() builder.

select 1;
