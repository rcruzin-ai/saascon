# Active todo — calorie-tracker

> Live checklist for the slice currently being built. Mirrors one task from `plan.md` at a time. Wipe and replace when moving to the next task.

## Current task: T-004 — Foods library + re-log (✅ done)

- [x] `listFoods()` and `relogFromFoodId(foodId)` in `queries.ts`. Re-log is one INSERT with a `select … from foods where id = ?` source — no extra SELECT round-trip.
- [x] `relogFood(formData)` server action with UUID-shape sanity check at the boundary; `revalidatePath("/")` and `revalidatePath("/foods")` on success.
- [x] `/foods` route — server component, one row per food, plain `<form action={relogFood}>` per row (no client JS), `aria-label="Log <name> again"` on every button.
- [x] Nav link "Foods →" added to `/`; `← Today` back link on `/foods`.
- [x] Build sizes: `/foods` = 163 B First Load JS (≤ 170 B target); `/` = 1.31 kB.
- [x] `npm run typecheck && npm run lint && npm run build` all green.
- [x] DB-direct: list returns 3 foods; re-log returns `{ entryId }`; missing food id → null; snapshots preserve old + new values across catalog updates; `lower(name)='oatmeal'` count stays 1 across re-logs.
- [x] `grep '"use client"' src/` returns 1 (still just the quick-add form).
- [x] `grep -nE 'prepare\(.*\$\{|prepare\(.*\+'` over db + actions returns zero.
- [x] Smoke: `/foods` rendered with all seed foods + re-log buttons; `/` shows "Foods →" nav link.
- [x] Commit `T-004: foods library + re-log`

## Blockers / questions

(none)

## Out-of-plan discoveries

(none yet)
