# Active todo — calorie-tracker

> Live checklist for the slice currently being built. Mirrors one task from `plan.md` at a time. Wipe and replace when moving to the next task.

## Current task: T-001 — Schema swap: foods + entries + settings

- [ ] Write SQLite migration to drop `examples` (`<ts>__drop_examples.sql`)
- [ ] Write SQLite migration to create foods/entries/settings + indexes + seed settings row (`<ts+1>__create_calorie_tracker.sql`)
- [ ] Mirror both as Postgres migrations with RLS enabled + `anon` read policies
- [ ] Rewrite `db/sqlite/schema.sql` and `db/schema.sql` to reflect the new tables
- [ ] Update `src/app/page.tsx` `ensureSeed` + badge probe to point at `settings` (not `examples`)
- [ ] Update `src/lib/supabase/health.ts` probe table from `examples` → `settings`
- [ ] Update `docs/er-diagram.md` Mermaid: foods 1—∞ entries; settings standalone
- [ ] `cd template && rm -f local.db local.db-shm local.db-wal && npm run dev` → DB badge green on first request
- [ ] `cd template && npm run typecheck && npm run lint && npm run build` all green
- [ ] Commit `T-001: schema for foods + entries + settings (drop examples)`
- [ ] Tick T-001 status to ☑ in `tasks/plan.md`
- [ ] **CHECKPOINT — pause for user review before T-002**

## Blockers / questions

(none — open questions resolved in SPEC.md §9)

## Out-of-plan discoveries

(none yet — log as `OOP-N` if anything surfaces)
