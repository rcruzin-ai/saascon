# Active todo — calorie-tracker

> v1 build complete — all 7 slices shipped. Ready for `/test` then `/review`.

## T-007 — Delete entry (✅ done)

- [x] `deleteEntryById(id)` in `queries.ts` — single parameterized DELETE; returns `{ changes }`.
- [x] `deleteEntry(formData)` server action — UUID-shape sanity check, then `deleteEntryById`, then `revalidatePath("/")`. Missing/invalid ids are no-ops (no error UI, no crash).
- [x] Per-entry icon-only delete button on `/`, plain `<form action={deleteEntry}>`, `aria-label="Delete <name>"`, `h-11 w-11` tap target, focus-visible ring.
- [x] DB-direct: deleting a known entry → totals shrink by exactly that entry's calories; deleting non-existent id → `changes=0` no crash; re-deleting same id → `changes=0`.
- [x] Smoke: `/` rendered three delete buttons each with the right `aria-label="Delete <name>"`; totals still 950 with seed.
- [x] Build sizes: `/` = 1.31 kB First Load JS (unchanged from T-005 — delete buttons added zero client JS).
- [x] `grep '"use client"' src/` returns 1 (still just the quick-add form).
- [x] `grep -nE 'prepare\(.*\$\{|prepare\(.*\+'` zero hits.
- [x] `npm run typecheck && npm run lint && npm run build` all green.
- [x] Commit `T-007: delete entry`

## Pre-`/test` checklist (from plan.md)

- [x] Fresh DB → green badge in < 2 s
- [x] Quick-add → entry on `/`
- [x] Quick-add same name with different macros → 1 food row, latest macros, new entry uses new snapshot
- [x] Re-log via `/foods` → new entry on `/`
- [x] Update target on `/settings` → `/` progress bar denominator changes
- [x] `/history` → 7 rows, today's row matches today's totals
- [x] Delete entry on `/` → totals shrink
- [x] typecheck + lint + build green
- [x] zero string-interp prepare hits
- [x] no `.claude/projects/` committed

## Out-of-plan discoveries

(none surfaced through the build)

## Next

`/test` (Vitest math + history aggregation) → `/review` (five-axis pass).
