# Active todo — calorie-tracker

> Live checklist for the slice currently being built. Mirrors one task from `plan.md` at a time. Wipe and replace when moving to the next task.

## Current task: T-001 — Schema swap (✅ done — awaiting checkpoint approval before T-002)

- [x] SQLite migration to drop `examples` (`20260509064922__drop_examples.sql`)
- [x] SQLite migration to create foods/entries/settings + indexes + seed settings row (`20260509064923__create_calorie_tracker.sql`)
- [x] Postgres mirrors with RLS enabled + `anon` read policies on all three tables
- [x] Rewrote `db/sqlite/schema.sql` and `db/schema.sql`
- [x] Health probe target swapped from `examples` → `settings` in `src/lib/supabase/health.ts`
- [x] Home page badge text updated; placeholder "saascon" copy replaced with "calorie tracker"
- [x] `docs/er-diagram.md` updated (foods 1—∞ entries; settings standalone)
- [x] Fresh DB → `npm run dev` → curl `/` returns `bg-green-500` + "settings table reachable · 1 row"
- [x] `npm run typecheck && npm run lint && npm run build` all green; `/` First Load JS = 120 B
- [x] Commit `T-001: schema for foods + entries + settings (drop examples)`

## Blockers / questions

(none — open questions resolved in SPEC.md §9)

## Out-of-plan discoveries

(none yet — log as `OOP-N` if anything surfaces)
