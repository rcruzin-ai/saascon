---
name: saascon-build-todo
description: Active checklist mirroring one task at a time from tasks/plan.md. Wipe and replace when moving to the next task.
---

# Active todo — saascon

> Live checklist for the slice currently being built. Mirrors one task from [plan.md](plan.md) at a time. Wipe and replace when moving to the next task.

## Current task: T-001 — Make `npm run lint` pass on a fresh install

- [ ] Add `eslint` + `eslint-config-next` to `template/package.json` `devDependencies`
- [ ] Create `template/.eslintrc.json` extending `next/core-web-vitals`
- [ ] Run `cd template && npm install` — succeeds with no install-blocking warnings
- [ ] Run `npm run lint` — exits 0
- [ ] Confirm no runtime deps were added
- [ ] Commit (atomic, message references T-001)

## Up next (do not start until current task ☑)

- T-002 — Replace `{{ project-name }}` placeholders so typecheck and build pass
- T-003 — Wire in Tailwind v4 (CSS-first, minimal config)
- T-004 — Demonstrate the migration convention with one example file
- T-005 — Validate Supabase env handling in a fresh-clone scenario
- T-006 — Final acceptance sweep + dep-count check

## Blockers / questions

- None known. If T-001 surfaces a peer-dep conflict between `eslint-config-next@15` and ESLint 9, fall back to the version pinned by `next@15.0.0` and note it in the commit message.
