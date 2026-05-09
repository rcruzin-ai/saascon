-- Anon write policies for the saascon `examples` placeholder table.
-- Lets cloud-mode quickly verify that the queries layer + RLS wiring
-- both work end-to-end (run `npm test` with DATABASE_URL set, or just
-- create one row from the app).
--
-- saascon ships no auth, so anon is the principal that browser-driven
-- Server Actions sign their writes as. When you replace `examples`
-- with your real entities, mirror this pattern: every table needs
-- explicit anon policies for whichever operations the public surface
-- exercises (insert, update, delete), or no writes will succeed.

create policy "anon insert examples"
  on examples for insert
  to anon
  with check (true);

create policy "anon delete examples"
  on examples for delete
  to anon
  using (true);
