---
name: saascon
description: Bare-minimum Next.js + Supabase B2C SaaS demo template, deployed to Vercel, scaffolded with the agent-skills workflow.
---

# SPEC — saascon

> This spec describes the **saascon template itself** — what it ships, how it is consumed, and the conventions every project cloned from it must follow. Each project cloned from saascon fills in its own `template/SPEC.md` (the per-project PRD).
>
> **Posture: lightweight demo.** This template optimizes for fast clone-to-running and minimal dependency surface. Tests, formatters, pre-commit hooks, UI component libraries, and similar tooling are deliberately **not** included by default — they are per-project add-ons.

## 1. Objective

**North star: speed up the next iteration.** saascon exists so that the next time the author builds a B2C SaaS demo, the path from idea to deployed app runs through the agent-skills lifecycle (`/spec → /plan → /build → /test → /review → /ship`) without re-deciding stack, re-wiring services, or re-debugging install/deploy. The template proves the entire pipeline — local dev, DB connection, deploy — works end-to-end before any product code is written.

A reusable, intentionally-minimal starting point for Next.js + Supabase B2C demo apps that deploy to Vercel. Cloning saascon should give a developer a project that is `dev`-runnable in under two minutes, with the full agent-skills workflow wired in but **no extra tooling weight**.

- **Problem:** every demo project re-decides framework version, DB client, and styling; re-wires Supabase + Vercel; re-debugs the same first-deploy issues. Heavier starters slow that down with deps the demo doesn't need.
- **Users:** the template author (rcruzin) and any future collaborators starting a B2C demo on this stack.
- **Success metrics:**
  - **Time-to-first-deploy:** from `git clone` → live URL in under 10 minutes.
  - **`npm install`** finishes in under 30 seconds on a warm cache.
  - **Total deps** under 15 in `template/package.json`.
  - **Home page** renders a Supabase health badge so the next builder sees DB connectivity status on first load — no console-digging to confirm the stack works.

## 2. Scope

### In scope
- [ ] Next.js 15 (App Router) + React 19 + TypeScript (strict) baseline in `template/`.
- [ ] Supabase JS client wired up in `template/src/lib/supabase/` with browser + server variants.
- [ ] Tailwind CSS configured (no component library, no shadcn primitives committed).
- [ ] `next lint` defaults — no extra ESLint plugins, no Prettier, no pre-commit hooks.
- [ ] `db/schema.sql` + `db/migrations/` convention with a placeholder schema.
- [ ] Agent-skills workflow already installed at root: `skills/`, `agents/`, `hooks/`, `.claude/commands/`, `references/`.
- [ ] Per-project artifact placeholders: `template/SPEC.md`, `template/PLANS.md`, `template/tasks/plan.md`, `template/tasks/todo.md`, `template/docs/architecture.md`, `template/docs/er-diagram.md`, `template/docs/tree.md`.
- [ ] `.env.example` documenting every required Supabase + Vercel variable.
- [ ] Vercel-ready: zero changes needed beyond connecting the project and setting env vars.
- [ ] Strict TypeScript: `strict: true`, no implicit `any`, no `// @ts-ignore` without a justification comment.

### Out of scope (explicit non-goals — keep it light)
- Authentication / login. saascon ships **no auth**.
- Vitest, Jest, or any unit-test framework in the template default deps.
- Playwright or any E2E test framework in the template default deps.
- shadcn/ui primitives committed in `src/components/ui/`. The shadcn CLI may be invoked per project; nothing is pre-generated.
- Prettier. Use editor format-on-save instead.
- Husky / lint-staged / pre-commit hooks.
- Stripe, payments, billing.
- Email sending (Resend, Postmark, etc.).
- Background jobs / queues.
- i18n.
- Analytics beyond Vercel defaults.
- Multi-tenant scaffolding.
- A CMS layer.

### Future / deferred (per-project add-on recipes, not template defaults)
- Optional Vitest recipe (documented in `docs/`).
- Optional Playwright recipe.
- Optional shadcn/ui primitives recipe.
- Optional auth recipe (Supabase Auth).
- Optional Stripe billing recipe.

## 3. User stories

```
As a <user type>, I want to <action> so that <outcome>.
```

- US-1: As the template author, I want to clone saascon into a new directory and have `npm run dev` work within 2 minutes, so I can start product work immediately.
- US-2: As the template author, I want `/spec` to fill in `template/SPEC.md` (not the root spec), so per-project PRDs stay scoped.
- US-3: As the template author, I want Supabase client setup and migrations conventions to already exist, so I never re-derive them.
- US-4: As the template author, I want the dependency footprint to stay tiny so the template stays fast to install and obvious to read.

## 4. Functional requirements

- FR-1: `template/package.json` exposes scripts: `dev`, `build`, `start`, `lint`, `typecheck`.
- FR-2: `npm install` succeeds on a clean clone with no peer-dep warnings that block install. Total install under 30s on a warm cache.
- FR-3: `npm run typecheck` (`tsc --noEmit`) passes with `strict: true`.
- FR-4: `npm run lint` (`next lint`) passes on the committed template code.
- FR-5: `db/schema.sql` is the canonical DDL; every change is also captured as a timestamped file in `db/migrations/`.
- FR-6: `.env.example` is committed; `.env` is gitignored.
- FR-7: The Supabase client in `src/lib/supabase/` exposes a server-side and a browser-side factory; the service-role key is never imported in code that ships to the browser bundle.
- FR-8: Total runtime + dev deps in `template/package.json` is small (target: under 15 entries combined).

## 5. Non-functional requirements

- **Install speed:** `npm install` under 30s on a warm cache, under 90s cold.
- **Performance:** `npm run dev` cold-start under 10s on the author's machine; `npm run build` under 60s.
- **Browser support:** modern evergreen (last 2 versions of Chrome, Safari, Firefox, Edge).
- **Privacy:** template ships no data collection. Per-project `SPEC.md` declares what each app collects.
- **Security:** secrets only in `.env` (gitignored). Supabase service-role key never imported in client components.

## 6. Data model (high-level)

The template ships **no domain entities**. It provides the schema scaffolding (`db/schema.sql` + `db/migrations/`) and a single placeholder table to demonstrate the migration convention. Each project replaces it.

- **Convention:** `db/schema.sql` is source of truth. Every change is also written as a new file in `db/migrations/` named `YYYYMMDDHHMM_<slug>.sql`. Migrations are append-only — never edit a past one; supersede with a new file.

## 7. Public surface

The template ships a single placeholder route. Real routes are added per project.

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/` | GET | Landing page placeholder rendering "saascon" | none |

## 8. External dependencies

- **Supabase:** Postgres database + JS client. Project URL and anon/service keys in `.env`.
- **Vercel:** hosting target. No code-level coupling beyond Next.js conventions.
- **Pinned tooling:** Next 15.x, React 19.x, TypeScript 5.6+, Node 20+, npm (ships with Node).

## 9. Open questions

- [ ] Whether to commit a `vercel.json` or rely entirely on dashboard configuration.
- [ ] Tailwind v3 vs v4 — pick the one with the smaller default install footprint at scaffold time.

## 10. Acceptance criteria

The template is "done" when:
- [ ] A fresh clone of saascon, with `.env` filled in, runs `npm install && npm run dev` in under 2 minutes total and serves the placeholder page at `localhost:3000`.
- [ ] `npm run typecheck && npm run lint` both pass on a fresh clone.
- [ ] `template/package.json` has fewer than 15 total dependencies (runtime + dev).
- [ ] No Vitest, Playwright, Prettier, Husky, lint-staged, shadcn primitives, or auth code is present in `template/`.
- [ ] Deploying the template to Vercel with the documented env vars yields a working preview URL with no code changes.
- [ ] Running `/spec` in a fresh clone fills in `template/SPEC.md` (per-project PRD), not the root spec.

---

## Commands

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build locally |
| `npm run lint` | `next lint` |
| `npm run typecheck` | `tsc --noEmit` |

That's it. No `test`, `test:e2e`, or `format` scripts in the default template.

## Project structure (root)

```
saascon/
├── SPEC.md                ← THIS FILE — describes the template
├── README.md              ← human-facing setup instructions
├── CLAUDE.md              ← agent context (currently describes agent-skills; replace per project)
├── AGENTS.md              ← OpenCode / generic-agent context
├── .env.example           ← required env vars
├── .claude/commands/      ← /spec /plan /build /test /review /ship
├── skills/                ← agent-skills SKILL.md workflows
├── agents/                ← code-reviewer, test-engineer, security-auditor
├── hooks/                 ← session-lifecycle hooks
├── references/            ← testing / security / performance / a11y checklists
├── docs/                  ← agent-tool setup guides (Cursor, Gemini, Copilot, …)
└── template/              ← the actual Next.js project that gets cloned
    ├── SPEC.md            ← per-project PRD placeholder
    ├── PLANS.md           ← per-project roadmap placeholder
    ├── tasks/             ← per-project plan + todo
    ├── docs/              ← per-project architecture / ER / tree
    ├── db/                ← schema.sql + migrations/
    ├── src/
    │   ├── app/           ← Next.js App Router routes
    │   ├── components/    ← per-project components (no UI library committed)
    │   └── lib/supabase/  ← server + browser Supabase clients
    ├── public/            ← static assets
    ├── package.json
    ├── tsconfig.json
    └── next.config.mjs
```

## Code style

- **TypeScript strict** — `strict: true`, no implicit `any`. `// @ts-ignore` only with a one-line justification.
- **Linting** — `next lint` defaults only. No extra ESLint plugins, no Prettier.
- **Formatting** — rely on editor format-on-save; no committed Prettier config.
- **File naming** — kebab-case for files, PascalCase for React components, camelCase for functions/vars.
- **Path alias** — `@/*` → `template/src/*` (already set in `tsconfig.json`).
- **No comments unless WHY is non-obvious.** Don't narrate what code does; let names do that.
- **Server vs client components** — default to server components; mark client components explicitly with `'use client'` and keep them small.

## Testing strategy

**The template ships no tests and no test framework.** This is deliberate — saascon is a demo template, and tests are a per-project add-on.

When a cloned project decides it needs tests, follow the agent-skills `test` skill and add Vitest (unit) and/or Playwright (E2E) as project-level dependencies. Manual smoke testing via `npm run dev` is the only verification expected at the template level.

## Boundaries

**Always:**
- Always keep `template/SPEC.md` as the per-project PRD placeholder; don't fill it from the template author's perspective.
- Always update `db/schema.sql` AND add a new file in `db/migrations/` for any schema change.
- Always pin Next.js / React / TypeScript versions in `template/package.json`.
- Always keep the dependency count tight — every new entry is a scope decision.

**Ask first:**
- Before adding any new runtime or dev dependency to `template/package.json`. Each addition fights the lightweight goal.
- Before changing the auth posture (template ships no auth — adding any is a scope change).
- Before introducing a new infrastructure provider (Stripe, Resend, analytics, etc.).
- Before changing the package manager, hosting target, or Node version floor.
- Before adding a test framework, formatter, or pre-commit hook to the template default (these are explicit non-goals).
- Before editing files in `skills/`, `agents/`, `hooks/`, or `.claude/commands/` (these come from agent-skills upstream).

**Never:**
- Never commit `.env` or any file with real secrets.
- Never import the Supabase service-role key into a client component or any code that could land in the browser bundle.
- Never edit a past migration in `db/migrations/` — always supersede with a new one.
- Never add Vitest, Playwright, Prettier, Husky, lint-staged, or shadcn primitives to the template defaults under "while I'm here." Those are per-project add-ons by design.
- Never introduce auth, payments, email, or analytics under the guise of "while I'm here." Those are scope changes.
