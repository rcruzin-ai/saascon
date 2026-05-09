-- Drop the saascon placeholder table. T-001 of the calorie-tracker build.

drop policy if exists "anon read examples" on examples;
drop index if exists examples_created_at_idx;
drop table if exists examples;
