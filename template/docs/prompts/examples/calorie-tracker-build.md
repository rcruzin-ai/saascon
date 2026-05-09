# Example: calorie-tracker local build

> Worked example of `template/docs/prompts/local-build-v1.md` with every `{{ placeholder }}` filled in for a calorie-tracker product. Use this as a reference when filling in the template for a different product, or copy this directly to rebuild the calorie tracker from scratch.

---

## Context

This is the prompt that drove the original calorie-tracker build (preserved on the `v0-calorie-tracker-demo` tag). It walks an agent through:

- Today view (logged foods + running totals + progress bar)
- Quick-add form (name + calories + optional macros)
- Foods library with one-tap re-log
- Daily target setting
- 7-day history with CSS bars
- Delete entry

End state: a working `npm run dev` demo on a `preview/calorie-tracker` branch, no auth, mobile-first, Server Components by default.

To use:

1. Fresh agent session at the saascon repo root
2. Branch off main: `git checkout -b preview/calorie-tracker`
3. Copy the prompt block below
4. Paste into the agent

The agent will pause for confirmation at four checkpoints (after `/spec`, after `/plan`, after T-001 schema slice, after T-003 quick-add slice).

---

## The prompt

```
Read TEMPLATE.md before doing anything else.

Today I want to build: a comprehensive calorie tracker — users log foods
they eat throughout the day, see daily totals against a target, and view
a 7-day history with simple charts.

Mode: local (SQLite, no Vercel/Supabase needed)

Constraints:
- Simple and modern, B2C, no auth in v1 (single-user local app)
- Server Components by default; 'use client' only on the quick-add form
- Tailwind utilities only, no UI library
- Stack is locked (Next.js 15 + Tailwind v4 + better-sqlite3 — see TEMPLATE.md §2)
- Home page DB badge must stay green throughout
- Mobile-first layout (this is the primary use case)

Scope for v1 (do not exceed without asking):
- A "today" view: list of foods logged today, running totals (calories,
  protein, carbs, fat), progress bar against a daily target
- A quick-add form: name + calories + optional macros (protein/carbs/fat in g)
- A "foods" library: previously-logged foods are remembered so re-logging
  is one click. No external food database, no barcode scanning.
- A daily target setting (single number, stored in a settings table)
- A "history" view: last 7 days, one row per day with totals and a simple
  CSS bar chart of calories vs target (no chart library)
- Delete a logged entry (no edit in v1 — delete + re-log)

Explicitly out of scope for v1 (defer; flag if I ask for these mid-build):
- Auth / multi-user
- Meal categories (breakfast/lunch/dinner) — flat list per day only
- Photo / file uploads
- Goals beyond a single calorie target (no macro targets, no weight tracking)
- Sync across devices
- Charts beyond simple CSS bars
- Editing past entries
- Cloud deploy / Vercel / Supabase port — local-only v1. The router
  in src/lib/db/queries.ts already dispatches both backends, so adding
  cloud support means writing each new query in BOTH queries-sqlite.ts
  and queries-supabase.ts as it's added — but that's only worth doing
  AFTER /review, only if I explicitly ask.

Data model (sketch — refine in /spec):
- foods (id, name, calories, protein_g, carbs_g, fat_g, created_at)
- entries (id, food_id, logged_at) — references foods
- settings (id=1 row, daily_calorie_target)

Drive the full lifecycle:

1. /spec   — draft template/SPEC.md from the above. Surface clarifying
             questions in a single AskUserQuestion round before /plan.
             Likely questions to surface (add anything else you spot):
             - Snapshot vs live-link semantics on entries (if a logged
               food's macros change later, do historical totals shift
               or stay frozen?)
             - Timezone handling for "today" — server-local for a
               single-user local app, or something else?
             - Default daily_calorie_target on a fresh DB
             - Success metric — what's the v1 demo signal?
             Pause for my confirmation before /plan.

2. /plan   — write template/tasks/plan.md as vertical slices. Default
             ordering: (a) schema + dual migrations + ER diagram (drop
             the saascon `examples` placeholder + queries; add foods,
             entries, settings), (b) today read view with seeded data,
             (c) quick-add form (the one 'use client' surface), (d)
             foods library + re-log, (e) settings + target progress bar,
             (f) history view + 7-day CSS bars, (g) delete entry.
             Pause checkpoints after the schema slice and after the
             quick-add form (riskiest UX moment). Each slice ends with
             a working localhost:3000 demo.

3. /build  — implement one slice at a time. After each slice:
               - npm run typecheck && npm run lint && npm run build
               - manual browser check on mobile viewport (DevTools)
               - commit referencing the task ID
               - update tasks/todo.md
             For DB changes: write BOTH the SQLite migration in
             template/db/sqlite/migrations/ AND the Postgres migration in
             template/db/migrations/ (same timestamp prefix). Mirror in
             both schema.sql files. SQLite migrations auto-apply on
             first dev-server request via src/lib/db/sqlite.ts — no
             init script needed. Postgres migrations stay dormant in
             local mode but become "ready to ship" if cloud is ever
             activated (`npm run migrate` applies them).

             For product queries: drop the saascon `examples` queries
             from queries-{sqlite,supabase,types}.ts. Add foods + entries
             + settings queries per the same router pattern — every
             query gets parity implementations on both backends, even
             in local-only v1. The TypeScript signature in queries.ts
             catches drift. Empty queries-supabase.ts functions are
             fine for purely local v1, but if you're writing a SQLite
             query, write its Supabase sibling too. Saves a port later.

4. /test   — vitest is already a devDep (no install needed). Write tests
             for: macro/calorie totals math, target progress calculation,
             "today" timezone boundary, history aggregation over 7 days
             with sparse + out-of-window entries. Tests run against a
             real fresh SQLite file per test (no mocks); follow the
             pattern in tests/queries-cloud-smoke.test.ts. Skip
             framework plumbing.

5. /review — five-axis pass:
             - Correctness (totals add up to hand-math; snapshot
               semantics preserved across catalog edits)
             - Readability (naming, file size, comment density)
             - Architecture (driver-specific types like better-sqlite3's
               `Statement` or supabase-js builders should NOT leak past
               src/lib/db/. Product row types in queries-types.ts ARE
               meant to leak — that's the contract.)
             - Security (input validation at the HTTP boundary on the
               quick-add form, every SQL value via `?` placeholder,
               UUID sanity check on the delete server action, no
               service-role key in browser bundles)
             - Performance (no N+1 on /history — single aggregate
               query + JS-side day fill; verify with
               `grep -c '\.prepare(' <fn-body>` returning 1; build
               sizes ≤ 170 B for non-client pages, ≤ 1.3 kB for /
               which hosts the quick-add form)
             Fix what you find inline; flag deferred items as
             Out-of-Plan in tasks/plan.md.

Stop and ask if:
- Scope drifts beyond the v1 list above
- You need a new dependency (vitest is already in; pg is already in;
  everything else is a stop-and-ask)
- Anything in /spec is ambiguous
- The Db interface in src/lib/db/index.ts doesn't fit a query
  (per playbook §4, drop it for product queries — use
  getSqliteConnection() in queries-sqlite.ts directly. The Db
  interface is for the health probe only.)

Don't expand scope mid-build. New ideas → new tasks in tasks/plan.md
under "Out-of-plan work."

## CRITICAL
- After /review passes, leave `npm run dev` running and tell me to open
  http://localhost:3000 in my browser. I'll click around the actual
  app to verify the demo before we declare done. Don't claim done from
  curl scrapes alone — UX claims need human eyes.

## Final step (optional, with my approval)
After /review passes AND I've browser-verified the demo, offer to push
to a new feature branch on the public remote (preview/calorie-tracker).
Never push to main. Never open a PR for the product build itself —
only template improvements get PRs to main. Always confirm before any
remote action.
```

---

## What this prompt produced (reference run)

The original session that produced `v0-calorie-tracker-demo` ran this prompt and shipped:

| Slice | What |
|---|---|
| T-001 | Schema (foods, entries, settings) + dual migrations + ER diagram |
| T-002 | Today read view + dev seed + ProgressBar component |
| T-003 | Quick-add form (the one `'use client'` surface) |
| T-004 | Foods library + one-tap re-log |
| T-005 | Settings page + daily target updates |
| T-006 | History view + 7-day CSS bars + single-aggregate-query rule |
| T-007 | Delete entry (per-row icon button) |

Plus a `/test` pass with 44 vitest tests, a `/review` pass with five axes, and (later) a `T-008` cloud-mode port that became the `cloud-deploy-v1.md` prompt.

Final build sizes: `/` = 1.31 kB First Load JS (with the quick-add form), all other pages = 167 B. Exactly one `'use client'` file in the codebase.

To inspect the actual code that resulted from this prompt:

```bash
git checkout v0-calorie-tracker-demo
# read template/SPEC.md, template/tasks/plan.md, src/lib/db/queries-*.ts, etc.
git checkout main
```

---

## Differences if you rebuild this today

The prompt above runs against `main` (the saascon scaffold with the cloud-ready router pattern shipped in PR #6/#7). A few things will look slightly different from the historical session:

- **Vitest is already a devDep.** `/test` skips the install step.
- **The router pattern is already wired.** `/build` adds queries to both `queries-sqlite.ts` and `queries-supabase.ts` from the start, which means no T-008 cloud-port slice is needed later.
- **The dev seed file exists** (`src/lib/db/seed-dev.ts`) but seeds the `examples` table by default. T-001's schema slice deletes the `examples` queries and seed contents, then T-002 adds the calorie-tracker seed.
- **`docs/prompts/cloud-deploy-v1.md` exists** as the natural follow-up after `/review` — when you decide to deploy, paste the cloud prompt instead of porting queries by hand.

---

## When NOT to copy this verbatim

This is a **specific** product example, not a generic template. The `local-build-v1.md` template is the generic version. If you're building something other than a calorie tracker, start from the template, not this file. Copying this verbatim and changing only the product name leaves a lot of calorie-specific reasoning (snapshot semantics on `entries`, the macro fields, the daily target singleton) that may not fit your actual product.
