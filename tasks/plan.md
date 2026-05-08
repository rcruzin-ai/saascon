---
name: saascon-build-plan
description: Vertically-sliced task plan to bring the saascon template to its acceptance criteria — lightweight Next.js 15 + Supabase + Tailwind v4 demo on Vercel.
---

# Plan — saascon template build-out

> Drives the work needed to satisfy [SPEC.md](../SPEC.md) acceptance criteria. Per-project plans (one per cloned project) live in `template/tasks/plan.md` and are out of scope here.

## Snapshot of current state

What already exists and works:
- `template/package.json` with `dev`/`build`/`start`/`lint`/`typecheck` scripts and `@supabase/supabase-js` pinned.
- `template/tsconfig.json` with `strict: true` and the `@/*` path alias.
- `template/src/app/{layout,page}.tsx` — placeholder routes (contain `{{ project-name }}` tokens).
- `template/src/lib/supabase/{client,server}.ts` — browser + server factories using anon key.
- `template/db/schema.sql` + `db/migrations/README.md` + migration conventions.
- `template/docs/{architecture,er-diagram,tree}.md` placeholders.
- Root: `.env.example`, `.gitignore`, agent-skills workflow (`skills/`, `agents/`, `hooks/`, `.claude/commands/`).

What's missing or broken vs. SPEC.md acceptance:
1. **No Tailwind setup.** SPEC requires Tailwind v4 configured; today there is none.
2. **`next lint` is not runnable.** No `eslint` / `eslint-config-next` dev deps; `next lint` will prompt or fail.
3. **`{{ project-name }}` tokens in `layout.tsx` / `page.tsx` are not valid TSX.** They will fail typecheck / build today.
4. **No example migration file** in `db/migrations/` — only the README. SPEC FR-5 wants the convention demonstrated.
5. **No global stylesheet** — needed once Tailwind is added.
6. **Acceptance unverified end-to-end** — `npm install`, `dev`, `build`, `lint`, `typecheck`, dep-count cap haven't been run on this machine.

## Dependency graph

```
T-001 (lint deps + first green check)
   │
   └─→ T-002 (fix placeholder TSX so typecheck passes)
          │
          └─→ T-003 (Tailwind v4 wired in, page renders styled)
                 │
                 ├─→ T-004 (example migration + schema demo)
                 │
                 └─→ T-005 (example .env handling sanity-check on a fresh install)
                        │
                        └─→ T-006 (final acceptance pass: dep count, full command sweep)
```

T-004 is independent of T-003 once T-002 lands; both can proceed in parallel after T-002. T-005/T-006 are the closing checkpoint and run last.

## Slicing principle

Each task delivers a **complete vertical slice** of one acceptance criterion — install → run → verify — rather than a horizontal layer (e.g. "add all configs first"). After each task, the template is still demo-runnable.

---

## Tasks

### T-001 — Make `npm run lint` pass on a fresh install
- **Why:** SPEC FR-4 + acceptance criterion: `npm run typecheck && npm run lint` must both pass on a clean clone. Today there are no ESLint deps, so `next lint` prompts interactively or errors.
- **Files touched:**
  - `template/package.json` — add `eslint` and `eslint-config-next` to `devDependencies`
  - `template/.eslintrc.json` (new) — `{ "extends": "next/core-web-vitals" }`
- **Acceptance criteria:**
  - [ ] `cd template && npm install` succeeds with no install-blocking peer warnings.
  - [ ] `npm run lint` exits 0.
  - [ ] No new runtime deps were added (lint deps go in `devDependencies`).
- **Verification:**
  ```
  cd template && npm install && npm run lint; echo "exit=$?"
  ```
  Expect `exit=0`.
- **Dependencies:** none
- **Status:** ☐ todo

### T-002 — Replace `{{ project-name }}` placeholders so typecheck and build pass
- **Why:** Mustache-style tokens in `.tsx` are not valid JSX expressions and will fail `tsc` and `next build`. SPEC FR-3 requires `npm run typecheck` to pass on a fresh clone.
- **Files touched:**
  - `template/src/app/layout.tsx` — replace `title`/`description` with literal `"saascon"` strings (or escape inside `{`...`}`)
  - `template/src/app/page.tsx` — replace `<h1>{{ project-name }}</h1>` with a literal string `<h1>saascon</h1>` and the placeholder `<p>` with a static one-liner
- **Decision:** use literal `"saascon"` placeholders rather than escaped JSX expressions; per-project clones overwrite these in their own `/build` flow.
- **Acceptance criteria:**
  - [ ] `npm run typecheck` exits 0.
  - [ ] `npm run build` exits 0.
  - [ ] `npm run dev` serves `localhost:3000` and the page renders without console errors.
- **Verification:**
  ```
  cd template && npm run typecheck && npm run build && npm run dev
  # In another shell: curl -sf localhost:3000 | grep -q saascon
  ```
- **Dependencies:** T-001 (so the eslint deps are installed and dev/build flows work end-to-end)
- **Status:** ☐ todo

### T-003 — Wire in Tailwind v4 (CSS-first, minimal config)
- **Why:** SPEC scope item: "Tailwind CSS configured (no component library)." Tailwind v4 was selected for the lighter install + CSS-first config.
- **Files touched:**
  - `template/package.json` — add `tailwindcss@^4` and `@tailwindcss/postcss@^4` to `devDependencies`
  - `template/postcss.config.mjs` (new) — single-line config registering `@tailwindcss/postcss`
  - `template/src/app/globals.css` (new) — `@import "tailwindcss";` plus a tiny base-layer reset if needed
  - `template/src/app/layout.tsx` — `import "./globals.css"`
  - `template/src/app/page.tsx` — apply two or three Tailwind utility classes to prove it's wired (e.g. `min-h-screen flex items-center justify-center text-2xl`)
- **Acceptance criteria:**
  - [ ] `npm run build` succeeds with the new CSS pipeline.
  - [ ] Visiting `localhost:3000` shows the page with the applied Tailwind utilities (visual check: centered, large text).
  - [ ] No `tailwind.config.js` or `tailwind.config.ts` is committed (Tailwind v4 supports zero-config; if a config is needed, it goes in CSS via `@theme`).
  - [ ] Total dev deps remain within the spec cap (track running total — see T-006).
- **Verification:**
  ```
  cd template && npm install && npm run build
  npm run dev   # then open localhost:3000 in a browser, confirm utilities render
  ```
- **Dependencies:** T-002
- **Status:** ☐ todo

### T-004 — Demonstrate the migration convention with one example file
- **Why:** SPEC FR-5 + scope: `db/schema.sql` + timestamped migrations. Today we have a schema with commented placeholders and an empty `db/migrations/` directory. A single example migration shows the convention without locking in domain content.
- **Files touched:**
  - `template/db/migrations/<timestamp>__example_table.sql` (new) — creates a single demo table (e.g. `examples (id uuid pk, label text, created_at timestamptz)`), enables RLS, adds an `anon select` policy
  - `template/db/schema.sql` — uncomment / replace the placeholder so the canonical schema reflects the migration
- **Decision:** the example table is named `examples` to make it obvious it should be deleted by the cloned project; cloned projects replace both the migration and schema entries with real entities.
- **Acceptance criteria:**
  - [ ] One file exists in `template/db/migrations/` matching `YYYYMMDDHHMMSS__*.sql`.
  - [ ] `template/db/schema.sql` content matches what the migration produces if applied to an empty DB.
  - [ ] README in `db/migrations/` still describes the workflow and is consistent with the example.
  - [ ] No code path imports the `examples` table — it exists only as documentation.
- **Verification:** `psql -d $TEST_DB -f db/migrations/<file>.sql` applies cleanly against an empty Postgres ≥ 14 with `pgcrypto` available. (Skip if no local Postgres — visual review of the SQL is sufficient at template level.)
- **Dependencies:** T-002 (independent of T-003; can run in parallel with T-003)
- **Status:** ☐ todo

### T-005 — Validate Supabase env handling in a fresh-clone scenario
- **Why:** SPEC FR-7: server/browser factories must not crash when `.env` is missing (template-level smoke), and the service-role key must never appear in the client bundle. Both `supabase/client.ts` and `supabase/server.ts` use non-null assertions on env vars today, which throws at module-load.
- **Files touched:**
  - `template/src/lib/supabase/client.ts` — guard so the module imports without env (e.g. lazy-init inside an exported `getBrowserSupabase()` function), or document that the placeholder route does not import it.
  - `template/src/lib/supabase/server.ts` — same lazy-init pattern (it already uses a function, so just confirm).
  - `template/src/app/page.tsx` — must NOT import `client.ts` at module scope; the demo page renders without DB access.
- **Decision:** keep the supabase modules importable without env, but the placeholder page does not import them at all. This keeps the dev-on-fresh-clone story working with an empty `.env`.
- **Acceptance criteria:**
  - [ ] With an empty `.env`, `npm run dev` and `npm run build` both succeed without runtime errors.
  - [ ] `grep -r "SUPABASE_SERVICE_ROLE_KEY" template/src` returns no matches outside server-only code (and ideally no matches at all in the default template — service-role usage is a per-project add-on).
  - [ ] `npm run build` output does not include any reference to `SUPABASE_SERVICE_ROLE_KEY` in client chunks (spot-check via `grep -r SERVICE_ROLE template/.next/static` after build — should be empty).
- **Verification:**
  ```
  cd template && cp ../.env.example .env && npm run build
  grep -r SERVICE_ROLE .next/static; echo "client-bundle-leaks=$?"
  ```
  Expect `client-bundle-leaks=1` (grep found nothing).
- **Dependencies:** T-002, T-003
- **Status:** ☐ todo

### T-006 — Final acceptance sweep + dep-count check
- **Why:** SPEC acceptance criteria require: install < 2 min total, < 15 deps in `template/package.json`, full command sweep clean. This task is the close-out checkpoint.
- **Files touched:** none (read-only verification + minor fixups if found).
- **Acceptance criteria:**
  - [ ] `jq '[.dependencies, .devDependencies] | add | length' template/package.json` returns `< 15`.
  - [ ] On a clean clone (`rm -rf template/node_modules template/.next`), `npm install && npm run typecheck && npm run lint && npm run build` all succeed in under 2 minutes wall-clock total.
  - [ ] No Vitest, Playwright, Prettier, Husky, lint-staged, shadcn-ui, or auth packages appear anywhere in `template/package.json`.
  - [ ] Update `template/SPEC.md` (per-project placeholder) is **not** modified; only verify it still has its placeholder content.
- **Verification:**
  ```
  cd template && rm -rf node_modules .next
  time (npm install && npm run typecheck && npm run lint && npm run build)
  jq '[.dependencies, .devDependencies] | add | length' package.json
  jq '[.dependencies, .devDependencies] | add | keys' package.json | \
      grep -Eqi 'vitest|playwright|prettier|husky|lint-staged|shadcn|next-auth' && \
      echo "FAIL: forbidden dep present" || echo "OK: no forbidden deps"
  ```
- **Dependencies:** T-001, T-002, T-003, T-004, T-005
- **Status:** ☐ todo

---

## Checkpoints

- **After T-001:** lint runs green; the project compiles for the first time. Commit.
- **After T-003:** template is "demo-shaped" — page loads styled in a browser. Manual smoke check + commit. **Pause for human review** before continuing.
- **After T-005:** Supabase posture is correct and verified. Commit.
- **After T-006:** plan is complete. Tag/branch as `template-v0.1` candidate.

## Out-of-plan work

Things that may surface during build but are *not* in this plan — capture here, don't silently expand:

- Replacing root `README.md` / `CLAUDE.md` content (currently describe agent-skills upstream, not saascon).
- Adding GitHub Actions CI for typecheck/lint on PR.
- Adding a `vercel.json` (SPEC open question — defer until first deploy reveals a need).
- Adding a recipe doc for "how to add Vitest/Playwright/auth to a cloned project."

## Risks

- **Tailwind v4 PostCSS plugin changes** — ecosystem still settling; if the canonical setup shifts, T-003 may need a revision.
- **Next 15 + React 19 peer-dep warnings** — pinned versions are recent; on a future Node minor, install may surface warnings.
- **Dep-count cap (< 15)** — adding `eslint` + `eslint-config-next` + `tailwindcss` + `@tailwindcss/postcss` brings dev-deps from 4 to ~8; runtime stays at ~3. Comfortably under the cap, but flag if any task threatens to push past 15.
