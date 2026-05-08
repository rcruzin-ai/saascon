# Migrations

Timestamped, append-only changes to the database. Never edit a merged migration — supersede it with a new one.

## Naming

```
<UTC-timestamp>__<short_snake_name>.sql
20260508120000__add_entity_a.sql
```

Generate timestamp: `date -u +%Y%m%d%H%M%S`

## Workflow

1. Write the migration file here.
2. Apply locally (Supabase CLI: `supabase db push` or psql).
3. Update `../schema.sql` to reflect the new canonical state.
4. Update `../../docs/er-diagram.md` if entities or relations changed.
5. Commit migration + schema + diagram together.

## Rollbacks

Forward-only by default. If you need to undo, write a new migration that reverses the change — don't delete the old one.
