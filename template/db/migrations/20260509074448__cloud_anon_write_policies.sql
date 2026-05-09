-- Cloud-mode write policies. saascon ships no auth; v1 of the calorie
-- tracker is a single-user app where the browser writes through Server
-- Actions that already validate at the boundary. Grant `anon` the right
-- to insert/update/delete on the three product tables so server-rendered
-- mutations work against Supabase.
--
-- This is the Postgres counterpart to a deliberately-empty SQLite sibling
-- (db/sqlite/migrations/<same-ts>__cloud_anon_write_policies.sql) — SQLite
-- has no RLS, so the local mode needs no migration here.

create policy "anon insert foods"
  on foods for insert
  to anon
  with check (true);

create policy "anon update foods"
  on foods for update
  to anon
  using (true)
  with check (true);

create policy "anon insert entries"
  on entries for insert
  to anon
  with check (true);

create policy "anon delete entries"
  on entries for delete
  to anon
  using (true);

create policy "anon update settings"
  on settings for update
  to anon
  using (true)
  with check (true);
