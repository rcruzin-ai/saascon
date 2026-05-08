# saascon — template project

A Next.js + Supabase + Tailwind v4 starter for B2C SaaS demos. Ships with a zero-setup local mode so you can build offline, then ship to Vercel + Supabase only when you're ready.

This file is for human readers. The agent-loaded context is in [TEMPLATE.md](../TEMPLATE.md) at the repo root.

## Quick start (local mode — no accounts needed)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The home page shows a green "local SQLite connected" badge.

That's it. No `.env` to fill in, no DB to provision, no account to create. The app uses a local SQLite file (`local.db`, auto-created on first request and gitignored). All migrations from [`db/sqlite/migrations/`](db/sqlite/migrations/) are auto-applied.

### What to expect

- **First `npm install`:** ~45 seconds on a fresh machine. Pulls Next.js, React, Supabase client, Tailwind v4, better-sqlite3, ESLint. The deprecation warnings npm prints (`inflight`, `glob@7`, `eslint@8`, etc.) are coming from inside `eslint-config-next` and `better-sqlite3` and are safe to ignore.
- **Subsequent `npm install`:** ~10 seconds (npm cache reuses the tarballs).
- **`npm run dev` startup:** ~1.5–2 seconds.

## Building your product

The agent-skills lifecycle drives the work. From the repo root in Claude Code (or your agent of choice), with [TEMPLATE.md](../TEMPLATE.md) referenced:

```
/spec   → fill in template/SPEC.md
/plan   → break into vertical slices
/build  → implement one slice at a time
/test   → tests where regressions are plausible
/review → five-axis quality pass
/ship   → deploy (cloud mode only)
```

In local mode you can stop at `/review`. `npm run dev` is the demo.

## Workspace layout

```
template/
├── README.md           ← this file
├── SPEC.md             ← per-project PRD — filled in by /spec
├── PLANS.md            ← per-project roadmap
├── tasks/              ← active plan + todo
├── docs/               ← architecture, ER diagram, project tree
├── db/
│   ├── schema.sql      ← Postgres source of truth (cloud mode)
│   ├── migrations/     ← Postgres migrations
│   └── sqlite/         ← SQLite mirror — schema + migrations for local mode
├── src/
│   ├── app/            ← Next.js App Router routes
│   ├── components/     ← shared UI
│   └── lib/
│       ├── db/         ← routing layer (auto-detects mode)
│       └── supabase/   ← server + browser Supabase clients (cloud mode)
└── public/             ← static assets
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the local dev server. Auto-creates the SQLite DB on first request in local mode. |
| `npm run build` | Production build. |
| `npm start` | Run the production build locally. |
| `npm run typecheck` | `tsc --noEmit` — strict type check. |
| `npm run lint` | `next lint` — Next.js core-web-vitals rules. |

## Going to production

Skip this section unless you're ready to deploy a public app.

To switch from local SQLite to a hosted Postgres, you'll provision a Supabase project and a Vercel project. The full step-by-step is in [TEMPLATE.md §2a](../TEMPLATE.md). The short version:

1. Create a Supabase project, copy the URL + anon key + service-role key into a new `.env` file (template at [`.env.example`](.env.example)).
2. Apply each migration from [`db/migrations/`](db/migrations/) to your Supabase project via the SQL Editor.
3. Create a Vercel project pointing at this repo with **Root Directory = `template`**, paste the same three keys into Vercel's Environment Variables, connect the GitHub repo.
4. The home page badge will now show "Supabase connected" instead of "local SQLite connected" — same code, different backend.

Mode is selected automatically based on `.env`:

- No `.env` (or `.env` without `NEXT_PUBLIC_SUPABASE_URL`) → **local SQLite mode**
- `.env` with `NEXT_PUBLIC_SUPABASE_URL` set → **Supabase mode**

Force a mode with `SAASCON_DB_DRIVER=sqlite` or `SAASCON_DB_DRIVER=supabase` in `.env`.

## Resetting local state

```bash
rm -f local.db local.db-shm local.db-wal
npm run dev   # next request rebuilds local.db from migrations
```
