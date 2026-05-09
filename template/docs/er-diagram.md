# ER Diagram — calorie-tracker

> Mermaid `erDiagram`. GitHub renders this natively. Keep it in sync with `db/schema.sql` and `db/sqlite/schema.sql`.

```mermaid
erDiagram
  FOODS {
    uuid id PK
    text name
    integer calories
    numeric protein_g
    numeric carbs_g
    numeric fat_g
    timestamptz created_at
  }
  ENTRIES {
    uuid id PK
    uuid food_id FK
    text name_snapshot
    integer calories_snapshot
    numeric protein_snapshot
    numeric carbs_snapshot
    numeric fat_snapshot
    timestamptz logged_at
  }
  SETTINGS {
    integer id PK
    integer daily_calorie_target
  }

  FOODS ||--o{ ENTRIES : "logs"
```

## Notes

- `entries.food_id` is **nullable** with `on delete set null`. Deleting a food preserves history; the snapshot columns keep the entry self-describing.
- **Snapshot semantics**: `entries.*_snapshot` columns capture nutrition at log time. Editing a food's catalog row does not retroactively change historical totals.
- `settings` is a **singleton** — `check (id = 1)` enforces a single row. The seed migration inserts `(1, 2000)` so a fresh database renders a working progress bar immediately.
- `foods` has a **unique index on `lower(name)`** to enable the upsert pattern (`on conflict (lower(name)) do update …`) without a select-then-write race.

## Notation

- `||--o{` — one-to-many
- `||--||` — one-to-one
- `}o--o{` — many-to-many (resolve via join table)
- `PK` — primary key
- `FK` — foreign key

## Update protocol

1. Change `db/schema.sql` and `db/sqlite/schema.sql` (siblings, not generated)
2. Add a migration pair in `db/migrations/` and `db/sqlite/migrations/` with the same timestamp prefix
3. Update this diagram
4. Verify rendering in the GitHub PR preview before merging
