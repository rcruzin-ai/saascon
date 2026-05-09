-- Intentionally empty. Sibling of the Postgres migration with the same
-- timestamp prefix. SQLite has no row-level security, so cloud-mode
-- write policies have no local-mode counterpart. Keeping the file
-- preserves the 1:1 migration-pair invariant — every Postgres migration
-- has a SQLite sibling, even when the SQLite side is a no-op.

-- noop
select 1;
