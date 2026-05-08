# Project tree — {{ project-name }}

> Annotated tree of the project. Update when adding top-level folders. Generate with `tree -L 3 -I 'node_modules|.next|.git'` and add notes.

```
{{ project-name }}/
├── README.md                    project overview (humans)
├── SPEC.md                      PRD — what we're building and why
├── PLANS.md                     long-horizon roadmap + decision log
├── tasks/
│   ├── plan.md                  current task breakdown
│   └── todo.md                  active checklist
├── docs/
│   ├── architecture.md          system design
│   ├── er-diagram.md            data model (Mermaid)
│   ├── tree.md                  this file
│   └── adr/                     architecture decision records
├── db/
│   ├── schema.sql               canonical DDL
│   └── migrations/              timestamped DDL changes
├── src/
│   ├── app/                     Next.js App Router
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts        browser-side client (anon key)
│   │       └── server.ts        server-side client (anon key, server context)
│   └── components/              shared UI
├── public/                      static assets
├── .env.example                 env var template (committed)
├── .env                         real values (gitignored)
└── package.json
```

## Conventions

- **Routes:** lowercase-kebab in `src/app/`
- **Components:** PascalCase, colocate with route when route-specific
- **DB queries:** stay in `src/lib/` — never inline in components
- **Types:** generate from Supabase schema via `supabase gen types typescript`
