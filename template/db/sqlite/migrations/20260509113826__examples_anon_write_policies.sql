-- Intentionally empty. Sibling of the Postgres migration with the same
-- timestamp prefix. SQLite has no row-level security, so cloud-mode
-- write policies have no local-mode counterpart. Keeping the file
-- preserves the 1:1 migration-pair invariant.

select 1;
