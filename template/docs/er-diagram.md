# ER Diagram — {{ project-name }}

> Mermaid `erDiagram`. GitHub renders this natively. Keep it in sync with `db/schema.sql`.

```mermaid
erDiagram
  ENTITY_A {
    uuid id PK
    text name
    timestamptz created_at
  }
  ENTITY_B {
    uuid id PK
    uuid entity_a_id FK
    text payload
    timestamptz created_at
  }

  ENTITY_A ||--o{ ENTITY_B : "has many"
```

## Notation

- `||--o{` — one-to-many
- `||--||` — one-to-one
- `}o--o{` — many-to-many (resolve via join table)
- `PK` — primary key
- `FK` — foreign key

## Update protocol

1. Change `db/schema.sql`
2. Update this diagram
3. Add a migration in `db/migrations/`
4. Verify rendering in the GitHub PR preview before merging
