# Starter prompt — local-mode v1 product build

> A reusable prompt template for driving the saascon lifecycle (`/spec → /plan → /build → /test → /review`) on a fresh clone. Copy this file, fill in the bracketed placeholders, paste into a new agent session.
>
> **Mode:** local SQLite, zero external services. Cloud deploy is explicitly out of v1 scope.
>
> The template ships ready: `npm install && cp .env.local.example .env && npm run dev` puts a green badge on `localhost:3000` in ~30 seconds. This prompt drives the agent from there to a working product.

---

## How to use this file

1. Copy the prompt block below.
2. Replace every `{{ placeholder }}` with values for your product.
3. Paste into a fresh agent session at the saascon repo root.
4. Watch for the four pause checkpoints (`/spec`, `/plan`, after T-001, after T-003).

The prompt is calibrated for a v1 vertical-slice build — a single B2C product, no auth, mobile-first, Server Components by default. If your product needs auth, multi-tenant data, real-time, payments, or other major surface, **don't use this prompt** — it'll fight you. Write a custom one.

---

## The prompt

```
Read TEMPLATE.md before doing anything else.

Today I want to build: {{ one-line description of the product }}

Mode: local (SQLite, no Vercel/Supabase needed)

Constraints:
- Simple and modern, B2C, no auth in v1 (single-user local app)
- Server Components by default; 'use client' only on the {{ which form? }}
- Tailwind utilities only, no UI library
- Stack is locked (Next.js 15 + Tailwind v4 + better-sqlite3 — see TEMPLATE.md §2)
- Home page DB badge must stay green throughout
- Mobile-first layout (this is the primary use case)

Scope for v1 (do not exceed without asking):
- {{ feature 1: a "view" — describe the read surface }}
- {{ feature 2: the primary write — usually a quick-add or submit form }}
- {{ feature 3: a list/library/history of past writes }}
- {{ feature 4: a settings or single-knob configuration }}
- {{ feature 5: an aggregation or report (last N days, totals, etc.) }}
- {{ feature 6: delete/destructive action — keep for last }}

Explicitly out of scope for v1 (defer; flag if I ask for these mid-build):
- Auth / multi-user
- {{ category-grouping or hierarchy }} — flat list / single level only
- Photo / file uploads
- {{ goals / targets beyond the single one in scope }}
- Sync across devices
- {{ visualizations beyond simple CSS bars }}
- Editing past entries
- Cloud deploy / Vercel / Supabase port — local-only v1. The router
  in src/lib/db/queries.ts already dispatches both backends, so adding
  cloud support means writing each new query in BOTH queries-sqlite.ts
  and queries-supabase.ts as it's added — but that's only worth doing
  AFTER /review, only if I explicitly ask.

Data model (sketch — refine in /spec):
- {{ entity-1 }} ({{ fields }}, created_at)
- {{ entity-2 }} ({{ fields }}) — references {{ entity-1 }}
- settings (id=1 row, {{ single config knob }})

Drive the full lifecycle:

1. /spec   — draft template/SPEC.md from the above. Surface clarifying
             questions in a single AskUserQuestion round before /plan.
             Likely questions to surface (add anything else you spot):
             - Snapshot vs live-link semantics on log-event entities
             - Timezone handling for "today" / day-boundary aggregations
             - Default values on first run (settings singleton row)
             - Success metric — what's the v1 demo signal?
             Pause for my confirmation before /plan.

2. /plan   — write template/tasks/plan.md as vertical slices. Default
             ordering: (a) schema + dual migrations + ER diagram (drop
             the saascon `examples` placeholder + queries; add real
             entities), (b) read view with seeded data, (c) primary
             write form (the one 'use client' surface), (d) library /
             list view, (e) settings / single-knob form, (f) aggregation
             / time-series report, (g) delete entry. Pause checkpoints
             after the schema slice and after the primary write form
             (riskiest UX moment). Each slice ends with a working
             localhost:3000 demo.

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
             from queries-{sqlite,supabase,types}.ts. Add your own per
             the same router pattern — every query gets parity
             implementations on both backends, even in local-only v1.
             The TypeScript signature in queries.ts catches drift.
             (Empty queries-supabase.ts functions are fine for purely
             local v1 — but if you're writing a SQLite query, write
             its Supabase sibling too. Saves a port later.)

4. /test   — vitest is already a devDep (no install needed). Write tests
             for: pure logic helpers (math, parsing, validation),
             aggregations (totals, history bucketing), TZ boundary cases,
             any non-obvious validation rule. Tests run against a real
             fresh SQLite file per test (no mocks); use
             tests/_helpers.ts pattern from this repo if it exists, or
             follow the queries-cloud-smoke.test.ts shape. Skip
             framework plumbing.

5. /review — five-axis pass:
             - Correctness (totals/aggregations match hand-math)
             - Readability (naming, file size, comment density)
             - Architecture (driver-specific types like better-sqlite3's
               `Statement` or supabase-js builders should NOT leak past
               src/lib/db/. Product row types in queries-types.ts ARE
               meant to leak — that's the contract.)
             - Security (input validation at the HTTP boundary, every
               SQL value via `?` placeholder, no service-role key in
               browser bundles, RLS write policies for any new cloud
               tables — see template/db/migrations/*anon_write_policies*
               for the pattern)
             - Performance (no N+1 on aggregations — single query +
               JS-side fill; verify with `grep -c '\.prepare(' <fn-body>`
               returning 1; build sizes ≤ 170 B for non-client pages,
               ≤ 1.3 kB for the page hosting the form)
             Fix what you find inline; flag deferred items as Out-of-Plan
             in tasks/plan.md.

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
to a new feature branch on the public remote (e.g.
`preview/{{ product-name }}`). Never push to main. Never open a PR for
the product build itself — only template improvements get PRs to main.
Always confirm before any remote action.
```

---

## Worked example: calorie tracker

For a concrete example of the placeholders filled in (data model, scope, out-of-scope, the `'use client'` form), see the `v0-calorie-tracker-demo` git tag:

```bash
git checkout v0-calorie-tracker-demo            # detached HEAD at the demo
# inspect template/SPEC.md, template/tasks/plan.md, the queries layer
git checkout main                               # return
```

The tag preserves the calorie-tracker session end-to-end (T-001 through T-008, vitest suite, five-axis review fixes, cloud port).

---

## Things that were learned the hard way (read before customizing)

- **`/spec` should pause for clarifying-question resolution before `/plan`.** Don't let the agent charge through. The spec gets stronger after one round of `AskUserQuestion`.
- **The dual-migration discipline matters even in local-only v1.** Skipping the Postgres migration "for now" means rewriting it later when cloud comes up. Cost of writing it upfront is ~30 seconds per migration; cost of doing it later is one slice.
- **The `'use client'` budget should be exactly one** for a v1 like this — the primary write form. Settings forms / re-log buttons / delete buttons all use `<form action={serverAction}>` (zero client JS). If your `/build` slice wants to add a second `'use client'`, push back.
- **Server Actions can't be cleanly tested via curl.** Decompose into (a) validation-parity tests on the parser, (b) DB-direct tests via `npx tsx` against a fresh DB. See template/CLAUDE.md §3 for the pattern.
- **Hand-math any totals the slice introduces.** Don't trust the agent's arithmetic just because the same SQL ran. The vitest cases come from this discipline.
- **Always `rm template/local.db*` before a fresh-DB smoke test.** Pre-existing local DB defeats the test.
