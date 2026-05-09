# Active todo — calorie-tracker

> Live checklist for the slice currently being built. Mirrors one task from `plan.md` at a time. Wipe and replace when moving to the next task.

## Current task: T-003 — Quick-add form (✅ done — checkpoint pause for user review before T-004)

- [x] Pure validation in `src/app/quick-add-parse.ts` (testable without React Flight)
- [x] `createEntry` server action in `src/app/actions.ts` — validates → upserts food → inserts entry → revalidatePath("/")
- [x] `upsertFoodAndLogEntry` helper in `queries.ts` — single transaction, `on conflict (lower(name)) do update returning id`, snapshots written to entries
- [x] `src/components/quick-add-form.tsx` (the only `'use client'` in the codebase): `useActionState`, name + calories + 3 macros, all wrapped in `<label>`, `inputMode="numeric"|"decimal"`, `role="alert"` errors, `min-h-11` submit, focus-visible ring
- [x] Wired into page: replaced T-002 placeholder with `<QuickAddForm />` above entries list
- [x] Validation parity table — 14 cases pass (happy path, name required/whitespace/length, calories non-int/negative/over, macros optional/decimal/invalid/over, name trim)
- [x] DB-direct: case-insensitive duplicate creates 1 food row with latest macros; 3 entries with snapshot fields preserved at log-time values; totals = 320+350+95 = 765 kcal
- [x] `grep '"use client"'` shows exactly one file — `quick-add-form.tsx`
- [x] `grep -nE 'prepare\(.*\$\{|prepare\(.*\+'` over db + actions returns zero hits
- [x] Build sizes: `/` First Load JS = 1.3 kB (target ≤ 1.3 kB), `/_not-found` unchanged
- [x] `npm run typecheck && npm run lint && npm run build` all green
- [x] Commit `T-003: quick-add form (one 'use client' surface)`

## Blockers / questions

(none)

## Out-of-plan discoveries

(none yet)
