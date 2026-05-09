# Active todo — calorie-tracker

> Live checklist for the slice currently being built. Mirrors one task from `plan.md` at a time. Wipe and replace when moving to the next task.

## Current task: T-002 — Today read view + dev seed (✅ done)

- [x] `getSqliteConnection()` exported from `src/lib/db/sqlite.ts`
- [x] `src/lib/db/queries.ts` — `todayUtcRange`, `getEntriesForToday`, `getTodayTotals`, `getDailyTarget` (all parameterized via `?`)
- [x] `src/lib/db/seed-dev.ts` — idempotent: empty-table guard + module-level memo, wrapped in transaction
- [x] `src/components/progress-bar.tsx` — server component, `role="progressbar"` + aria-valuenow/min/max, color shift past 100%
- [x] `src/app/page.tsx` rewritten: mobile-first wrapper, header, totals + progress bar, macros row, entries list with HH:MM local timestamps, quick-add placeholder, health badge moved to footer
- [x] Hand-math verified: seeded 320+150+480 = 950 kcal, 59P/114C/27F — `getTodayTotals` returns exactly that
- [x] Idempotency verified: second `seedDev()` call did not double totals
- [x] TZ boundary verified: entry planted 25h ago does NOT appear in today's queries
- [x] `npm run typecheck && npm run lint && npm run build` all green; `/` First Load JS = 120 B (no client components)
- [x] `grep '"use client"' src/` returns nothing
- [x] Progress bar in rendered HTML: `role="progressbar" aria-valuenow="950" aria-valuemax="2000"`
- [x] Commit `T-002: today read view + dev seed`

## Blockers / questions

(none)

## Out-of-plan discoveries

(none yet)
