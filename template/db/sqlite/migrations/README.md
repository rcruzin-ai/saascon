# SQLite migrations

Mirrors `db/migrations/` but in SQLite dialect. Used by local-only mode
(`SAASCON_DB_DRIVER=sqlite`).

Whenever you add a Postgres migration in `db/migrations/`, add the SQLite
equivalent here with the same timestamp prefix. The `npm run db:init` script
applies every file in this directory in lexicographic order to the local
SQLite file (`SAASCON_SQLITE_PATH`, default `./local.db`).

Forward-only — never edit a merged migration. Supersede with a new file.

## Dialect notes

| Postgres feature              | SQLite equivalent                                  |
|-------------------------------|----------------------------------------------------|
| `uuid` + `gen_random_uuid()`  | `text` + app generates UUIDs (`crypto.randomUUID`) |
| `timestamptz`                 | `text` storing ISO-8601 (`datetime('now')`)        |
| `enable row level security`   | _(not applicable — drop the line)_                 |
| `create policy ... to anon`   | _(not applicable — drop the line)_                 |
| `jsonb`                       | `text` (parse with `JSON.parse`)                   |
