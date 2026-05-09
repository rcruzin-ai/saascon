# Example: calorie-tracker cloud deploy

> Worked example of `template/docs/prompts/cloud-deploy-v1.md` with every `{{ placeholder }}` filled in for the calorie-tracker product. Use this as a reference when filling in the template for a different product, or copy this directly when redeploying the calorie tracker.

---

## Context

This is the prompt that drove the original calorie-tracker cloud deploy (T-008 in the historical session, before the router pattern was extracted to the template). It walks an agent through:

- Auditing dual-driver query parity
- Porting any SQLite-only queries to Supabase
- Confirming RLS write policies on every product table
- Applying schema migrations to Supabase via `npm run migrate`
- Smoke-testing the cloud path end-to-end via `npm test`
- Standing up a Vercel preview deploy with the user driving the dashboard
- Browser-verifying the live preview URL

End state: a working preview URL like `https://saascon-git-preview-calorie-tracker-<team>.vercel.app/` with the same demo flow that worked locally.

To use:

1. **Verify prerequisites first** (see `cloud-deploy-v1.md` checklist) — local v1 must be browser-verified, `template/.env` must be fully populated, you must be on the `preview/calorie-tracker` branch
2. Fresh agent session at the saascon repo root, on the `preview/calorie-tracker` branch
3. Copy the prompt block below
4. Paste into the agent

The agent will pause at seven checkpoints — one after each step.

---

## The prompt

```
Read TEMPLATE.md and template/docs/deploy-vercel.md before doing anything else.

Today I want to deploy the calorie tracker (currently on the
preview/calorie-tracker branch) to a Vercel preview URL backed by
Supabase. The local SQLite v1 already shipped + reviewed +
browser-verified. This is the cloud port + deploy slice.

Mode flip: cloud (Supabase + Vercel preview). Production env stays parked.

Constraints:
- Same stack as v1 (Next.js 15 + Tailwind v4 + better-sqlite3 + Supabase)
- Server Components by default; same 'use client' budget as v1
  (just the quick-add form)
- No new dependencies (pg, vitest, tsx are already in)
- Vercel "Production" env stays empty — preview-only deploy
- Supabase RLS: foods, entries, and settings tables each need explicit
  anon insert/update/delete policies for whichever operations the public
  surface uses (saascon ships no auth; anon is the write principal).
  The v1 read policies aren't enough — without write policies the
  first cloud insert silently fails.

Drive the deploy lifecycle. Pause checkpoints after each numbered step.

1. /audit  — read src/lib/db/queries-{sqlite,supabase,types}.ts. For
             every function exported from queries.ts (the router),
             confirm it has implementations on BOTH backends with
             matching return types. Surface any that are SQLite-only
             (the Supabase impl is missing or stubbed). Pause and
             report findings before /port. Don't write code yet.

             Expected functions for the calorie tracker:
             - getEntriesForToday, getTodayTotals (today view)
             - upsertFoodAndLogEntry (quick-add form)
             - listFoods, relogFromFoodId (foods library)
             - getDailyTarget, setDailyTarget (settings)
             - getHistoryLastNDays (history view)
             - deleteEntryById (delete entry)

2. /port   — for each query identified in /audit as SQLite-only, write
             the Supabase sibling. Mirror the SQLite shape:
               - Same return type (queries-types.ts is the contract)
               - Document atomicity caveats in a comment if the SQLite
                 version uses conn.transaction() and the Supabase
                 version becomes sequential .insert() + .insert() calls
                 (upsertFoodAndLogEntry is the case where this matters
                 most — failure mode is "food saved, entry not logged")
               - For the upsert by lower(name) pattern: add a generated
                 column `name_lower text generated always as
                 (lower(name)) stored` via a new migration pair, then
                 use .upsert(..., { onConflict: 'name_lower' })
               - For relogFromFoodId's `INSERT … SELECT FROM foods
                 WHERE id = ?` pattern: split into .select() + .insert();
                 document the partial-failure window
             Run `npm run typecheck` after each function. Commit per
             query: "port: <fn> to Supabase". Pause when /audit's list
             is empty.

3. /policies — for foods, entries, and settings, confirm a Postgres
              migration grants anon the matching policy:
                - foods: insert + update (upsert), no delete (cascade
                  via FK)
                - entries: insert + delete (write + remove from log)
                - settings: update (the daily target changes)
              Read template/db/schema.sql and grep for `create policy.*for
              (insert|update|delete)`. If any policy is missing, add a
              migration pair (Postgres real, SQLite no-op) following
              the pattern in template/db/migrations/*anon_write_policies*.
              Pause and report which migrations got added.

4. /apply  — verify template/.env has DATABASE_URL set. If missing or
             empty, stop immediately and tell me — do NOT try to look
             it up in any dashboard or regenerate it. .env is the
             source of truth and I populate it manually.
             Run `npm run migrate`. The script reads DATABASE_URL from
             .env, tracks applied migrations in schema_migrations, and
             is idempotent. Verify with a `select count(*) from
             schema_migrations` round-trip — every file in db/migrations/
             should have a row. Pause and report.

5. /smoke  — run `npm test`. The cloud smoke test in
             tests/queries-cloud-smoke.test.ts hits Supabase end-to-end
             (CRUD round-trip — for the calorie tracker, rewritten to
             test the actual product queries, not the placeholder
             examples). Local SQLite tests stay fast and don't talk
             to network. If the cloud smoke fails, diagnose: usually
             a missing RLS policy or migration drift. Don't move past
             this step until it's green.

6. /vercel — push the branch (git push -u origin preview/calorie-tracker).

             For the Vercel dashboard part, I'll handle it manually.
             Tell me to:
               - Add New → Project → import rcruzin-ai/saascon
               - Set Root Directory = template/  (CRITICAL — not repo root)
               - Set branch to deploy = preview/calorie-tracker
               - On the Environment Variables panel, set these 4 vars
                 with Preview checked, Production unchecked. The values
                 come straight from template/.env (which I already
                 populated):
                   - NEXT_PUBLIC_SUPABASE_URL
                   - NEXT_PUBLIC_SUPABASE_ANON_KEY
                   - SUPABASE_SERVICE_ROLE_KEY
                   - NEXT_PUBLIC_TIMEZONE
                 Skip DATABASE_URL and VERCEL_* vars — those are
                 local-tooling-only.
               - Click Deploy.

             You don't paste my values, copy my .env, or use the
             Vercel API. Just tell me what to click and where; I do
             the dashboard work. Wait for "deployed" before /verify.

7. /verify — once the preview URL is up:
             - curl -sI <url> → expect HTTP 200 (or 401 if Vercel
               Authentication is enabled — also valid)
             - Open in browser, confirm DB badge is green:
               "Supabase connected · settings reachable · 1 row"
             - Run the v1 calorie tracker demo flow end-to-end:
               · Quick-add a food (e.g. "test apple", 95 cal)
               · Confirm it appears on /, totals climb
               · Visit /foods → "test apple" listed
               · Tap "Log again" → returns to / with new entry
               · Visit /history → today's bucket shows the totals
               · Visit /settings → change target → / progress bar
                 denominator changes
               · Delete an entry on / → totals shrink
             - Verify writes persist by reloading after a write
             Pause and report the URL.

Stop and ask if:
- /audit surfaces queries that aren't a clean port (e.g. SQLite uses
  a feature with no Supabase equivalent) — these need design discussion
- /policies migrations conflict with existing schema (rename, drop
  column, etc.) — supersede with new migrations, don't edit applied ones
- /smoke fails after /policies and /apply both passed — that's a real
  bug, not a config issue
- The Vercel build fails — usually Root Directory or env var typo
- I ask for production deploy — that's a separate decision, this
  prompt is preview-only

Don't:
- Push to main (template improvements only — products live on preview/<name>)
- Open a PR for the product itself
- Set Production env vars in Vercel (keep it parked)
- Skip the migration tracking — schema_migrations is the source of
  truth for what's been applied, don't manually edit it
- Run the Vercel CLI without my approval (the dashboard is fine for
  one-off deploys; CLI tokens add transcript risk)

## CRITICAL
- Don't claim done from curl alone. The /verify step requires me
  opening the URL in a browser and clicking through the calorie
  tracker demo flow. Wait for my "✓ verified" before declaring
  complete.

## Final step
After /verify passes:
- Update template/PLANS.md with the live preview URL + deploy date
- Optionally suggest enabling Vercel Authentication on the preview
  (Vercel project → Settings → Deployment Protection) if the URL
  shouldn't be publicly readable
- Tag the deployed commit if it's a milestone (e.g.
  v0-calorie-tracker-cloud-preview)
```

---

## What this prompt produced (reference run)

The original deploy session that took the calorie tracker to a live preview URL ran (an earlier draft of) this prompt and shipped:

| Step | What | Result |
|---|---|---|
| /audit | Identified 9 queries that needed Supabase siblings | All flagged for /port |
| /port | Wrote 9 Supabase implementations | 1 commit per query, typecheck green throughout |
| /policies | Added cloud_anon_write_policies + foods_name_lower_generated migration pairs | Both migrations queued for /apply |
| /apply | `npm run migrate` against Supabase | Migrations 4 of 4 applied (after the saascon `examples` placeholder + the calorie-tracker schema) |
| /smoke | `npm test` cloud path against real Supabase | All passed in ~50s |
| /vercel | Vercel dashboard import + env vars | Preview URL live in ~1 min |
| /verify | Browser-verified the demo flow | All 7 user paths worked end-to-end |

That preview URL was later torn down (project deleted via Vercel API), but the deployment artifact existed and proved the pattern. The `v0-calorie-tracker-demo` git tag preserves the source code that produced it.

---

## Differences if you rebuild this today

The prompt above runs against `main` (with the cloud-ready router pattern + working example queries on `examples` already shipped via PRs #6 and #7). A few simplifications:

- **/audit will probably surface fewer queries** if the build was done with the dual-driver discipline from the start. Both `queries-sqlite.ts` and `queries-supabase.ts` get filled in during `/build`, not after.
- **The `examples_anon_write_policies` migration is already on main** (it ships as part of the saascon scaffold for the placeholder table). For your real product tables you still need to add their own write policies in `/policies`.
- **The `foods_name_lower_generated` migration is calorie-tracker-specific.** Your product may need its own generated column if it has a similar case-insensitive uniqueness pattern, or may not need one at all.
- **`tests/queries-cloud-smoke.test.ts` already exists** but tests the `examples` placeholder by default. T-008 in the original session rewrote it to test real product queries — `/smoke` does the same in any cloud deploy, swap the placeholder CRUD for your product's CRUD.

---

## When NOT to copy this verbatim

This is a **specific** product example, not a generic template. The `cloud-deploy-v1.md` template is the generic version.

If you're deploying something other than the calorie tracker:
- The expected function list in `/audit` will be different (your product's queries, not foods/entries/settings)
- The RLS policies in `/policies` need to match your tables, not foods/entries/settings
- The demo flow in `/verify` walks through your product's UX, not the calorie tracker's

Copying this verbatim and changing only the product name will produce a deploy run that audits the wrong queries and verifies the wrong UX. Start from the generic template instead.
