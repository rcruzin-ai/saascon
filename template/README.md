# {{ project-name }}

> Replace this README with your project's real one. This file is the entry point for human readers — the agent-loaded context lives in `CLAUDE.md` at the workspace root.

## Stack

- **Framework:** Next.js (App Router)
- **Database:** Supabase (Postgres)
- **Hosting:** Vercel
- **Auth:** none (public app)

## Workspace layout

```
template/
├── README.md           ← this file (project overview for humans)
├── SPEC.md             ← PRD — filled in by /spec
├── PLANS.md            ← roadmap & milestones
├── tasks/
│   ├── plan.md         ← task breakdown — filled in by /plan
│   └── todo.md         ← active checklist — updated during /build
├── docs/
│   ├── architecture.md ← system design + decisions
│   ├── er-diagram.md   ← entity-relationship diagram (Mermaid)
│   └── tree.md         ← annotated project tree
├── db/
│   ├── schema.sql      ← canonical DDL (source of truth)
│   └── migrations/     ← timestamped, append-only changes
├── src/
│   ├── app/            ← Next.js routes (App Router)
│   ├── lib/supabase/   ← Supabase client setup
│   └── components/     ← shared UI
└── public/             ← static assets
```

## Getting started

1. Copy `template/` to a new project folder, or work directly inside it for a single-app workspace.
2. Run `/spec` to fill in [SPEC.md](SPEC.md).
3. Run `/plan` to produce [tasks/plan.md](tasks/plan.md).
4. Define schema in [db/schema.sql](db/schema.sql), update [docs/er-diagram.md](docs/er-diagram.md).
5. Run `/build` slice by slice.
6. Deploy with `/ship` (Vercel + Supabase migration).

## Environment

Copy `../.env.example` to `../.env` and fill in your Supabase + Vercel values. The workspace `.gitignore` already excludes `.env`.
