# Follow-up prompt — cloud deploy after local v1

> Use this in a **new agent session** after a local-mode product has shipped (`preview/<product-name>` branch tagged, browser-verified, no in-flight `/build` work). It drives porting any not-yet-cloud-implemented queries, applying schema migrations to Supabase, and standing up a Vercel preview deploy.
>
> **Audience:** repeat deployer. Skips Supabase + Vercel dashboard hand-holding — assumes you can find the Connect button and the Environment Variables panel without step-by-step screenshots.
>
> **Reference:** `template/docs/deploy-vercel.md` for full UI walkthroughs if needed.

---

## How to use this file

1. Copy the prompt block below.
2. Replace every `{{ placeholder }}` with values for your product.
3. Paste into a fresh agent session at the saascon repo root, on the `preview/<product-name>` branch.
4. Watch for the four pause checkpoints (after parity check, after migration apply, after Vercel link, after smoke test).

The prompt is calibrated for the v1 dual-driver pattern that ships on `main` — every product query has SQLite + Supabase implementations in `src/lib/db/queries-{sqlite,supabase}.ts` paired by `queries.ts`. If your product skipped the dual-write discipline during `/build` (queries-supabase.ts has empty stubs for some functions), the prompt has a recovery step. **It does not handle products that diverged from the router pattern entirely** — write a custom prompt for those.

### Per-user assumptions

Every template user has their **own** Supabase project, **own** Vercel team, **own** `.env`. This file is the same for everyone; the values are never. Specifically:

- `template/.env` is gitignored and never shared. Yours stays on your machine.
- Supabase project IDs, anon keys, service-role keys, DB passwords, and Vercel project IDs are all **per-user** and live only in your `.env`.
- The prompt below uses generic placeholders (`{{ product-name }}`) so users at different points in the codebase can use the same file without contamination.
- Do not paste your `.env` values into chat. The agent reads them from disk via the migrate script and via Next.js itself. The dashboard work is yours; the agent never touches your dashboards.

---

## Prerequisites the prompt expects

Before pasting, make sure:

- [ ] You're on the `preview/{{ product-name }}` branch with all v1 work committed
- [ ] `npm test` is green locally (SQLite path)
- [ ] You browser-verified `npm run dev` end-to-end
- [ ] **`template/.env` is fully populated** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_TIMEZONE`, `DATABASE_URL`. This was a one-time setup step when you first cloned the template — `.env` is the source of truth for credentials throughout the deploy.
- [ ] Vercel account is linked to the same GitHub identity that owns the saascon repo

If any of these are not done, **don't run this prompt yet**. Finish the local build, run `/review`, get the demo browser-verified, populate `.env`, then come back.

**The agent reads from `.env` and only `.env`** — it should never ask you to paste values, never try to look anything up in a Supabase or Vercel dashboard, never assume a value can be regenerated. If `.env` is missing or incomplete, the agent fails loudly and stops.

---

## The prompt

```
Read TEMPLATE.md and template/docs/deploy-vercel.md before doing anything else.

Today I want to deploy {{ product-name }} (currently on the preview/{{ product-name }}
branch) to a Vercel preview URL backed by Supabase. The local SQLite v1
already shipped + reviewed + browser-verified. This is the cloud port +
deploy slice.

Mode flip: cloud (Supabase + Vercel preview). Production env stays parked.

Constraints:
- Same stack as v1 (Next.js 15 + Tailwind v4 + better-sqlite3 + Supabase)
- Server Components by default; same 'use client' budget as v1
- No new dependencies (pg, vitest, tsx are already in)
- Vercel "Production" env stays empty — preview-only deploy
- Supabase RLS: every product table needs explicit anon insert/update/
  delete policies for whichever operations the public surface uses
  (saascon ships no auth; anon is the write principal). The v1 read
  policies aren't enough — without write policies the first cloud
  insert silently fails.

Drive the deploy lifecycle. Pause checkpoints after each numbered step.

1. /audit  — read src/lib/db/queries-{sqlite,supabase,types}.ts. For
             every function exported from queries.ts (the router),
             confirm it has implementations on BOTH backends with
             matching return types. Surface any that are SQLite-only
             (the Supabase impl is missing or stubbed). Pause and
             report findings before /port. Don't write code yet.

2. /port   — for each query identified in /audit as SQLite-only, write
             the Supabase sibling. Mirror the SQLite shape:
               - Same return type (queries-types.ts is the contract)
               - Document atomicity caveats in a comment if the SQLite
                 version uses conn.transaction() and the Supabase
                 version becomes sequential .insert() + .insert() calls
               - For `on conflict (lower(name)) do update` patterns:
                 add a generated column `<col>_lower text generated
                 always as (lower(<col>)) stored` via migration pair,
                 then use .upsert(..., { onConflict: '<col>_lower' })
               - For `INSERT … SELECT FROM` patterns: split into
                 .select() + .insert(); document the partial-failure
                 window
             Run `npm run typecheck` after each function — the router
             catches drift loudly. Commit per query: "port: <fn> to
             Supabase". Pause when /audit's list is empty.

3. /policies — for every product table that has writes (insert /
              update / delete), confirm a Postgres migration grants
              anon the matching policy. Read template/db/schema.sql
              and grep for `create policy.*for (insert|update|delete)`
              on each table. If any table is missing a needed write
              policy, add a migration pair (Postgres real, SQLite
              no-op) following the pattern in
              template/db/migrations/*anon_write_policies*. Pause
              and report which migrations got added.

4. /apply  — verify template/.env has DATABASE_URL set. If missing
             or empty, stop immediately and tell me — do NOT try to
             look it up in any dashboard or regenerate it. .env is
             the source of truth and I populate it manually.
             Run `npm run migrate`. The script reads DATABASE_URL
             from .env, tracks applied migrations in schema_migrations,
             and is idempotent. Verify with a `select count(*) from
             schema_migrations` round-trip — every file in
             db/migrations/ should have a row. Pause and report.

5. /smoke  — run `npm test`. The cloud smoke test in
             tests/queries-cloud-smoke.test.ts hits Supabase end-to-
             end (CRUD round-trip on the examples table — or whatever
             the test was rewritten to target during /build).
             Local SQLite tests stay fast and don't talk to network.
             If the cloud smoke fails, diagnose: usually missing RLS
             policy or migration drift. Don't move past this step
             until it's green.

6. /vercel — push the branch (git push -u origin preview/{{ product-name }}).

             For the Vercel dashboard part, I'll handle it manually.
             Tell me to:
               - Add New → Project → import rcruzin-ai/saascon
               - Set Root Directory = template/  (CRITICAL — not repo root)
               - Set branch to deploy = preview/{{ product-name }}
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
               "Supabase connected · <table> reachable · N row(s)"
             - Run the v1 demo flow end-to-end (the same path you
               browser-verified locally before deploying)
             - Verify writes persist by reloading the page after a
               write
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
  opening the URL in a browser and clicking through the v1 demo flow.
  Wait for my "✓ verified" before declaring complete.

## Final step
After /verify passes:
- Update template/PLANS.md (or product's tasks/plan.md) with the live
  preview URL + deploy date
- Optionally suggest enabling Vercel Authentication on the preview
  (Vercel project → Settings → Deployment Protection) if the URL
  shouldn't be publicly readable
- Tag the deployed commit if it's a milestone (e.g.
  `v0-{{ product-name }}-cloud-preview`)
```

---

## What this prompt does NOT do

By design, the prompt skips:

- **Production deploys.** Preview-only is the safe default; promoting to production is a manual decision per project.
- **Custom domain setup.** Vercel auto-assigns `<project>-git-<branch>-<team>.vercel.app`. Custom domains need DNS work the agent shouldn't drive.
- **Edge-config / middleware / image optimization tuning.** Out of v1 scope; the saascon scaffold defaults are fine.
- **Multi-environment setup.** No staging branch; preview = staging, prod stays empty.
- **Auto-rotation of leaked secrets.** If you paste a service-role key into chat, you're responsible for rotating.
- **CI integration.** No GitHub Actions, no automatic Vercel deploy on push to preview branch (Vercel does that itself once linked).

---

## When NOT to use this prompt

Skip this prompt and write a custom one if:

- Your product needs auth (Supabase Auth setup, RLS policies that depend on `auth.uid()`)
- You're deploying to **production**, not preview
- You've diverged from the dual-driver router pattern (e.g. all queries are Supabase-only)
- Your product talks to external services beyond Supabase (Stripe, Resend, Redis, etc.) — env vars and RLS implications need product-specific thinking

---

## Recovery: if /audit surfaces lots of SQLite-only queries

If `/build` skipped the dual-write discipline ("I'll port to Supabase later"), `/audit` will surface a long list. That's fine — `/port` handles it incrementally. Each port commit is reviewable; nothing has to land in one go.

If the list is genuinely long (>10 queries), pause after the first 2-3 ports and `npm run typecheck` to validate the pattern is working before continuing. Cheap insurance.

---

## Things learned the hard way (read before customizing)

- **Apply migrations BEFORE setting Vercel env vars.** If Vercel deploys against an empty schema, the first request errors loudly and the build success masks the runtime failure.
- **Set `NEXT_PUBLIC_TIMEZONE` explicitly.** Default is UTC. "Today" rolls at the wrong wall-clock time silently if missed.
- **Vercel Root Directory is `template`, not the repo root.** Most common deploy failure. The prompt repeats this for a reason.
- **The migration runner uses Session pooler (port 5432), not Transaction pooler (port 6543).** Transaction pooler doesn't allow DDL.
- **Supabase free tier auto-pauses after 7 days idle.** If you don't visit your preview for a week, the next page load goes red until you click "Resume" in Supabase. Not a bug.
- **Service-role keys must never enter `NEXT_PUBLIC_*`.** The router uses `getServerSupabase()` which reads `SUPABASE_SERVICE_ROLE_KEY` server-only. If you find yourself wanting to expose it client-side, you're doing it wrong.
