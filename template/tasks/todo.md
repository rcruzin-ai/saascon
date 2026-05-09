# Active todo — calorie-tracker

> Live checklist for the slice currently being built. Mirrors one task from `plan.md` at a time. Wipe and replace when moving to the next task.

## Current task: T-006 — History view + 7-day CSS bars (✅ done)

- [x] `getHistoryLastNDays(days, now)` in `queries.ts` — ONE aggregate query (`group by date(logged_at, 'localtime')`) + JS fill of empty days.
- [x] `/history` route — server component, 7 rows newest-first, today highlighted, CSS bar (gray/green/red) per day with `role="progressbar"` and `aria-valuenow/min/max`.
- [x] `/` nav now stacks: Foods → / History → / Settings →.
- [x] Hand-math: planted entries on today (500), today-2 (800), today-5 (1200), and today-8 (out of window). Got back exactly 7 rows with `[500, 0, 800, 0, 0, 1200, 0]`. Sum = 2500. Out-of-window entry NOT included.
- [x] **ONE aggregate query** verified: `awk` over `getHistoryLastNDays` body → `grep -c '.prepare('` returns **1**.
- [x] Build sizes: `/history` = 167 B First Load JS (≤ 170 B target).
- [x] `grep '"use client"' src/` returns 1 (still just the quick-add form).
- [x] `grep -nE 'prepare\(.*\$\{|prepare\(.*\+'` zero hits.
- [x] `npm run typecheck && npm run lint && npm run build` all green.
- [x] Smoke: `/history` rendered with 7 progressbars, each showing the right `aria-valuenow` per day, all sharing `aria-valuemax="2000"`.
- [x] Commit `T-006: history view + 7-day CSS bars`

## Blockers / questions

(none)

## Out-of-plan discoveries

(none yet)
