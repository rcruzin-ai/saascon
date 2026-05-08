---
name: saascon-session-starter
description: Session-starter prompt for AI coding agents working in a saascon clone. Tells the agent the stack, conventions, lifecycle, and what "good" looks like so it can drive a B2C SaaS build via the agent-skills slash commands.
---

# TEMPLATE.md — saascon session starter

> **For the agent reading this:** you are working inside a saascon clone. The next sections are the operating manual. Read all of it once at session start. After that, follow the lifecycle in §6 and don't re-read unless conventions are unclear.
>
> **For the human:** drop your one-line product idea below the lifecycle prompt and run `/spec`. saascon's slash commands and skills will take it from there.

---

## 1. What saascon is

A pre-wired Next.js + Supabase + Tailwind v4 starter for a single B2C SaaS product. The stack is locked. The agent-skills workflow (`/spec → /plan → /build → /test → /review → /ship`) is locked. The product is yours to define.

**The bet:** every minute spent re-deciding stack or re-debugging "why won't install work" is a minute not spent shipping. saascon eats those minutes once so future iterations skip them.

## 2. Stack — locked

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript strict |
| UI | Tailwind v4 (CSS-first; `@import "tailwindcss"`), no component library |
| Database | **Two modes** — see §2a |
| Auth | **None by default.** Add Supabase Auth per project if needed. |
| Hosting | Vercel (Root Directory = `template`) — only required for cloud mode |
| Package manager | npm |
| Lint | `next lint` (default, no Prettier, no Husky) |
| Tests | None in defaults — add Vitest/Playwright per project when justified |
| Email / payments / queues / i18n | None in defaults |

If a task wants to add anything outside this table, that is a **scope change** — surface it before adding.

## 2a. Database modes — local SQLite vs cloud Supabase

saascon supports two DB backends behind a tiny interface in `template/src/lib/db/`. Mode is auto-detected by env:

| Mode | Trigger | What runs |
|---|---|---|
| **Local SQLite (default)** | No `.env`, or `.env` lacks `NEXT_PUBLIC_SUPABASE_URL` | `better-sqlite3` against `./local.db`. Schema + migrations in `db/sqlite/`. Auto-applied on first request. **Zero external services.** |
| **Cloud Supabase** | `.env` sets `NEXT_PUBLIC_SUPABASE_URL` + the two keys | `@supabase/supabase-js` against the cloud project. Schema + migrations in `db/`. Apply via Supabase SQL Editor. |

**Force a mode:** set `SAASCON_DB_DRIVER=sqlite` or `SAASCON_DB_DRIVER=supabase` in `.env`.

**The contract:**
- A fresh clone runs locally with `npm install && npm run dev`. No env editing, no Docker, no service signups. The home page badge turns green within 2 seconds.
- To go to production, fill in `.env` with Supabase credentials and deploy to Vercel. The same page now talks to the cloud DB.
- Both modes share the same `Db` interface (`countRows`, `selectRecent`, `insertOne`). Add new methods to that interface in **both** adapters when a feature needs them, or import the underlying client directly when you've outgrown the abstraction.
- **The two schemas are siblings, not generated.** Every Postgres migration in `db/migrations/` should be mirrored in SQLite dialect at `db/sqlite/migrations/` with the same timestamp prefix. Dialect notes in `db/sqlite/migrations/README.md`.
- **RLS exists only in Supabase mode.** SQLite has no row-level security; local mode is single-user by design.

## 3. Project layout — what goes where

```
saascon/
├── SPEC.md                    ← describes the saascon TEMPLATE itself; do not edit per-project
├── TEMPLATE.md                ← this file
├── tasks/                     ← saascon template build-out plan; do not edit per-project
└── template/                  ← THE PROJECT (this is what you ship)
    ├── SPEC.md                ← per-project PRD — fill in via /spec
    ├── PLANS.md               ← per-project roadmap
    ├── tasks/                 ← per-project plan + active todo
    ├── docs/architecture.md   ← system design — update as it changes
    ├── docs/er-diagram.md     ← Mermaid ER diagram — update with schema
    ├── db/
    │   ├── schema.sql         ← SOURCE OF TRUTH for the DB
    │   └── migrations/        ← timestamped, append-only DDL
    ├── src/
    │   ├── app/               ← Next.js routes (default to Server Components)
    │   ├── components/        ← shared UI
    │   └── lib/supabase/      ← server.ts, client.ts, health.ts
    └── public/                ← static assets
```

**Hard rule:** product code lives under `template/`. Files at the saascon root describe the template, not the product.

## 4. Coding conventions

- **TypeScript strict.** No implicit `any`, no `// @ts-ignore` without a one-line justification.
- **Server Components by default.** Add `'use client'` only when interactive state, browser APIs, or event handlers require it. Keep client components small and leaf-ish.
- **No comments unless WHY is non-obvious.** Names do the explaining. Don't narrate; don't reference task IDs in code.
- **No premature abstraction.** Three similar lines beats a wrong abstraction. Wait for the third copy.
- **No defensive code.** Don't validate at internal boundaries; trust your own modules. Validate only at system edges (HTTP, DB, env).
- **Path alias:** `@/*` → `template/src/*`.
- **File naming:** kebab-case for files, PascalCase for components, camelCase for fns/vars.

## 5. Database conventions — non-negotiable

- `db/schema.sql` is **the source of truth** for cloud mode. `db/sqlite/schema.sql` is the source of truth for local mode. Both reflect current schema.
- Every change is **also** a new file in `db/migrations/` named `YYYYMMDDHHMMSS__<short_snake_name>.sql` AND a sibling file with the same name in `db/sqlite/migrations/` in SQLite dialect.
- **Never edit a merged migration.** If you need to undo, write a new migration that reverses the change.
- Every table has **RLS enabled** in the Postgres migration. (Local SQLite has no RLS — that's a deliberate parity gap.)
- saascon ships no auth — Postgres policies grant the `anon` role explicitly when public access is intended.
- The **service-role key never reaches the browser bundle.** Server-only code paths only.
- Postgres migrations are applied to Supabase via the SQL Editor (or `supabase db push` if the user has Supabase CLI). SQLite migrations are auto-applied on first dev-server request — no command needed.
- The `examples` table from the seed migration is a **placeholder.** Delete it when you replace it with real entities — but keep the convention. When you replace it, remove it from BOTH `db/migrations/` and `db/sqlite/migrations/` with corresponding new migrations.

## 6. The lifecycle — how to drive a session

Use the slash commands in this order. Each one has a corresponding skill that knows what to produce.

### `/spec` — define the product
- Fills in `template/SPEC.md` (per-project PRD).
- Asks the human what they're building, who for, success metrics, scope, non-goals, data entities.
- **Don't start coding without a spec.** Ambiguity compounds.

### `/plan` — break it down
- Writes `template/tasks/plan.md` and `template/tasks/todo.md`.
- Vertical slices (one complete path per task), not horizontal layers.
- Every task has acceptance criteria + verification steps.
- Identify the dependency graph; flag what can run in parallel.

### `/build` — implement one slice at a time
- Pick the top todo. Mark it `in_progress`. Implement. Mark `completed` immediately on done.
- After each slice: typecheck, lint, build, manual browser check on `localhost:3000`.
- Commit per slice with a message that references the task ID (e.g. `T-003: add feedback submission flow`).
- Do not batch unrelated changes into one commit.

### `/test` — prove it works
- Add Vitest tests for pure logic, server actions, lib helpers — only when behavior is non-obvious or a regression is plausible. Don't test framework plumbing.
- Add Playwright for one smoke spec per critical user flow when E2E is justified.
- For bugs: write the failing test first (Prove-It pattern), then fix.

### `/review` — quality gate
- Five-axis check: correctness, readability, architecture, security, performance.
- Look hard at: RLS policies (every table?), server-only secrets (any leaks?), N+1 queries, accessibility, loading/error states.

### `/ship` — deploy
- Push to `main`. Vercel auto-deploys.
- Confirm the production URL renders the change.
- Update `template/PLANS.md` decision log if a non-obvious choice was made.

## 7. What "simple and modern" looks like for saascon

When the human's idea is fuzzy and they ask "what should it look like," default to this shape:

- **A single public-facing page** that does one useful thing and does it fast.
- **Server-side data fetching** (Server Component → Supabase → render). No client-side data fetching unless you need it.
- **Minimal interactive surface** — one or two forms at most for v1.
- **No login wall.** Anyone can read; writes are RLS-policied (anon insert allowed for the public submission, or auth-gated if added later).
- **Progressive enhancement** — page works without JS for the read path.
- **Tailwind utilities directly in JSX.** No CSS files except `globals.css`. No design system; reach for `text-*`, `bg-*`, `rounded-*`, `gap-*` and stop.
- **Zero external services beyond Supabase + Vercel** for v1. Add others only when a feature genuinely demands them.
- **Mobile-first by default** — `min-h-screen flex flex-col items-center justify-center p-4 md:p-8` is a fine starting layout.

If the human pushes for fancy (animations, dashboards, dark mode, brand systems): finish the core read+write loop first, then add polish. Polish is an `/build` slice, not a prerequisite.

## 8. Boundaries — what to do, ask first about, never do

**Always:**
- Always update `db/schema.sql` AND add a new file in `db/migrations/` for any DB change.
- Always run typecheck + lint + build before committing.
- Always default to Server Components.
- Always enable RLS on every new table.

**Ask first:**
- Before adding any new dependency to `template/package.json`. Each addition fights the lightweight goal.
- Before adding auth, payments, email, analytics, queues, i18n. These are scope changes, not "while I'm here" additions.
- Before changing the package manager, hosting target, or stack version pins.
- Before introducing a UI library (shadcn/ui, Radix, MUI, etc.). Tailwind utilities are usually enough.
- Before writing client-side data fetching when a Server Component would do.

**Never:**
- Never commit `.env` or any file containing real secrets.
- Never import the Supabase service-role key into a Client Component or any module that lands in the browser bundle.
- Never edit a past migration in `db/migrations/` — supersede with a new one.
- Never bypass the lint/typecheck gates with `--no-verify` outside a documented emergency.
- Never narrate completed work in code comments or in the chat — the diff and the commit message are the record.
- Never expand scope mid-task. New scope → new task in `tasks/plan.md`.

## 9. Common rationalizations to refuse

The agent's instinct will produce these mid-build. None of them are good enough on their own.

- "It's just a small dep" → still costs install time and review surface. Justify it.
- "I'll add auth/Stripe/Resend now since the user will want it later" → no, only when a current feature requires it.
- "Let me also clean up this nearby code while I'm here" → separate task, separate commit.
- "I'll skip the migration file and just edit `schema.sql`" → no. The migration is the deploy artifact.
- "I'll just `'use client'` the whole page so I don't have to think about it" → no. Find the actual leaf that needs interactivity.
- "I'll mock Supabase in the test" → integration tests use a real Supabase test project. Mocks have burned us before.
- "The build passes, ship it" → did you check the page in a browser? Did you check mobile? Did you check the loading and error states?

## 10. Red flags — stop and reconsider

If you see yourself doing any of these, pause and re-read the spec/plan:

- A single task touching > 5 files outside its core domain.
- A commit that crosses the spec's "out of scope" list.
- Code that imports `process.env.SUPABASE_SERVICE_ROLE_KEY` outside `template/src/lib/supabase/server.ts` (or a clearly server-only file).
- A new component with `'use client'` and no obvious interactive surface.
- A migration that drops a column without a corresponding plan to migrate data.
- Lint or typecheck failures being silenced rather than fixed.
- The home page Supabase health badge turning yellow or red without an explanation in the commit.

## 11. Verification — how to know a session went well

By the end of any working session:
- [ ] `npm run typecheck && npm run lint && npm run build` all green from the `template/` directory.
- [ ] The home page renders correctly on `localhost:3000` — Supabase badge is green.
- [ ] Every commit on the branch has a meaningful message referencing the task it addresses.
- [ ] `db/schema.sql` matches what's actually in Supabase (post any new migrations).
- [ ] `template/SPEC.md`, `template/PLANS.md`, and `template/tasks/` reflect current reality, not yesterday's plan.
- [ ] Vercel preview URL for the branch is healthy (`Ready` status, page loads).

If any of these is off, fix it before declaring done.

---

## Starter prompt — paste this into your first session

> **Stack:** Next.js 15 + (SQLite local OR Supabase cloud) + Tailwind v4. Stack is locked.
>
> **Today I want to build:** _<one-line product idea here — e.g. "a public link-shortener with click counts" or "a 'today I learned' feed where anyone can post short notes">_
>
> **Mode:** _<"local" for offline demo, no external services / "cloud" to ship to Vercel>_.
>
> **Constraints:** simple and modern, B2C, no auth in v1. In cloud mode the deploy must work end-to-end before any feature work. In local mode, skip `/ship` — `npm run dev` is the demo.
>
> Read TEMPLATE.md, then run `/spec` to draft `template/SPEC.md` for this product. Ask me clarifying questions as needed. Don't start `/plan` until I confirm the spec.
