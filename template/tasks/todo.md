# Active todo — calorie-tracker

> Live checklist for the slice currently being built. Mirrors one task from `plan.md` at a time. Wipe and replace when moving to the next task.

## Current task: T-005 — Settings + daily target (✅ done)

- [x] `setDailyTarget(value)` added to `queries.ts`
- [x] `updateDailyTarget(formData)` server action with boundary validation (string of digits, 500–10000); redirect to `?error=invalid` on bad input, `?ok=1` on success; `revalidatePath("/")` before redirect.
- [x] `/settings` route — server component, single-knob form (no `'use client'`), inline `role="alert"` / `role="status"` messages from query params, `defaultValue={current}` so the input shows the current target.
- [x] `/` nav now has both "Foods →" and "Settings →" links stacked.
- [x] DB-direct: `setDailyTarget(2500)` → `getDailyTarget()` returns 2500; another `setDailyTarget(1800)` → 1800; `/`'s `aria-valuemax` follows.
- [x] Validation parity: 12 cases pass (happy 2000/500/10000, below min, zero, above max, letters, empty, decimal, negative, null, whitespace).
- [x] Build sizes: `/settings` = 165 B First Load JS (≤ 170 B target); `/foods` = 165 B; `/` = 1.31 kB.
- [x] `grep '"use client"' src/` returns 1 (still just the quick-add form).
- [x] `grep -nE 'prepare\(.*\$\{|prepare\(.*\+'` zero hits.
- [x] `npm run typecheck && npm run lint && npm run build` all green.
- [x] Commit `T-005: settings + daily target`

## Blockers / questions

(none)

## Out-of-plan discoveries

(none yet)
