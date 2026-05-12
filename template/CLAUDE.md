# template/CLAUDE.md — Build playbook for saascon products

> **For the agent:** auto-loaded by Claude Code whenever the working directory is `template/` or below. Read this once at session start, then follow the playbook for the rest of the session. The repo-root `CLAUDE.md` describes the agent-skills *framework*; this file describes *building products on the template*.
>
> If the user has dropped a one-line product idea, you're being asked to drive a build. Defaults below should fire automatically — only deviate when the user explicitly says so or when a feature genuinely demands it.

---

## 1. Lifecycle pacing — pause at the gates

Even when the user's prompt looks like a complete brief, run the lifecycle commands as discrete turns with confirmation pauses between them:

| Gate | Pause for |
|---|---|
| After `/spec` | Open-question resolution. Group small ones into a single `AskUserQuestion` round. Don't proceed to `/plan` until decisions are recorded back into `template/SPEC.md`. |
| After `/plan` | Show slice list + dependency graph + non-obvious choices (health-probe target, dev-seed strategy, abstraction calls). Don't start `/build` without "go". |
| Plan-named checkpoints | Typically after the schema slice and after the riskiest write slice. Honor what the plan named. |
| Before any remote action | Pushing, opening a PR, deploying. Always confirm. |

**Anti-pattern:** charging through `/spec → /plan → /build` in one message because "the brief was complete." It is not — the brief becomes complete after the open questions are answered.

---

## 2. Default vertical-slice ordering

When the user gives a v1 brief, default to this slice order unless they request otherwise:

1. **Schema + dual migrations + ER diagram.** Drop the saascon `examples` placeholder, add real entities. After this slice the home-page DB badge re-greens on the new schema.
2. **Read view with seeded data.** Server-rendered list/totals on `/`. Add a *dev-only idempotent seed* so the next slice has something to render.
3. **Quick-add / primary write path.** ONE `'use client'` form. Server Action with input validation at the HTTP boundary. **User-confirmation checkpoint right after this slice — riskiest UX moment.**
4. **Library / read-of-write-history view.** Server-action button per row, no new client surface.
5. **Settings / single-knob form.** Server-component form with redirect-to-`?ok=1`/`?error=invalid` (avoids a second `'use client'` surface).
6. **Aggregations / time-series reports.** Single SQL query with JS-side fill. No N+1.
7. **Delete / destructive actions.** Last, smallest. Per-row server-action button.

Each slice must end with a working `localhost:3000` demo of the new behavior and its own commit.

---

## 3. Per-slice gate

Every slice ends with these five steps in order. Don't skip to "save time."

1. **`npm run typecheck && npm run lint && npm run build`** (from `template/`) — all three green.
2. **Smoke test** with a fresh DB (`rm template/local.db*`, then `npm run dev`, then hit the route).
3. **Hand-math any totals** the slice introduces. Don't trust the math came from the same query you just wrote.
4. **Commit** with `T-00X: <slice title>`. Don't batch unrelated changes.
5. **Tick** the slice in `tasks/todo.md` AND flip the status in `tasks/plan.md`.

### Smoke-test reality checks

- **Server Actions can't be cleanly driven via curl.** They need React Flight serialization + `$ACTION_REF_*` and `$ACTION_KEY` form fields. When the harness has no browser, decompose into:
  - **(a)** Validation parity test: replicate the action's parsing functions in a `npx tsx` script, run a table of cases.
  - **(b)** DB-direct test: drive the underlying mutation via `node -e` against `local.db` to prove the SQL behaves.
  - Together they cover the action end-to-end without HTTP.
- **Mobile DevTools verification can't be driven from headless harnesses.** Inspect Tailwind classes by reading the JSX (`max-w-md`, `≥44px` tap targets, `focus-visible:ring-*`) and **say so explicitly** when claiming success.
- **Keep `tsx` scripts inside `template/`.** `/tmp` lacks `node_modules` and `better-sqlite3` won't resolve. Delete the script when verification is done.
- **Always `rm template/local.db*` before a fresh-DB smoke test.** Pre-existing local DB defeats the test.

---

## 4. DB patterns

### Drop the saascon `Db` interface for product queries

The `Db` interface in `src/lib/db/index.ts` (`countRows` / `selectRecent` / `insertOne`) is intentionally tiny. It does NOT fit:
- Aggregations (`sum`, `count`, `group by`)
- Joins
- Parameterized `where` clauses
- `on conflict do update` (upsert)

**Don't bloat it.** Instead, in `src/lib/db/queries.ts`:
- Export `getSqliteConnection()` from `src/lib/db/sqlite.ts` (one-line wrapper around the cached connection).
- Import it in `queries.ts` and use prepared statements directly.
- Keep the `Db` interface for the health probe — that's its remaining job.

### Upsert by case-insensitive name → use `on conflict ... do update`

**Never SELECT-then-UPDATE/INSERT.** The race window between read and write defeats unique indexes and produces silent UX bugs.

```ts
const newId = randomUUID();
const row = conn.prepare(`
  insert into <table> (id, name, ...)
  values (?, ?, ...)
  on conflict (lower(name)) do update set
    field = excluded.field,
    ...
  returning id
`).get(newId, trimmedName, ...) as { id: string };
```

`returning id` lets you pick up either the new id or the existing one with no follow-up SELECT.

### Server-local timezone for "today" boundaries (single-user apps)

SQLite stores `datetime('now')` as UTC ("YYYY-MM-DD HH:MM:SS", no `Z`). For "today" queries:

- Build `[startUtc, endUtc)` from `new Date()` using `getFullYear/Month/Date()` (local) for boundaries, then format with `getUTC*` parts.
- Use `>= ? and < ?` (open right interval) — never `between` (which double-counts midnight).
- Single-user local apps: server-local TZ = user-local TZ. No client-TZ plumbing.
- Multi-user cloud apps: pass client TZ via cookie or header.

For history aggregation, the SQLite spelling is:
```sql
select date(logged_at, 'localtime') as d, sum(...) ...
from <table>
where date(logged_at, 'localtime') >= ?
group by d
```
Then JS-fill missing dates so the view renders a fixed N-day window.

### Single-aggregate-query rule for time-series

Last-N-days views must use ONE aggregate query (`group by date(...)`) plus a JS-side fill of empty buckets. **Verify with `grep -c '\.prepare(' <function-body>` → expect 1.** N+1 (one query per day) is the trap.

### Always parameterize SQL

Every value goes via `?` placeholder. Zero string interpolation in `prepare(...)`. Periodic verification:

```bash
grep -nE 'prepare\(.*\$\{|prepare\(.*\+' template/src/lib/db/*.ts template/src/app/actions.ts
```
Expect zero hits.

### Snapshot semantics for "logged events"

When the brief says "log an X" and X has properties that can change later (price, nutrition, name), **snapshot the relevant fields onto the log row**. Catalog row carries the *current* best estimate; log row carries *what was true at log time*. History stays immutable, which is almost always what users actually want.

### Dev-seed pattern

`src/lib/db/seed-dev.ts` — idempotent, runs only when relevant tables are empty AND only the first time per process (memoize a module-level `checked` flag). Wrap in `conn.transaction(() => { ... })`. Fire it from `app/page.tsx` only — keep the seed concern out of `getSqliteConnection()`.

### Dual-migration discipline

Every DB change ships as **four artifacts**:

1. New file in `db/migrations/` (Postgres) — `YYYYMMDDHHMMSS__<short_snake>.sql`
2. Sibling file in `db/sqlite/migrations/` — same filename, SQLite dialect
3. Updated `db/schema.sql` (Postgres canonical)
4. Updated `db/sqlite/schema.sql` (SQLite canonical)

Plus the ER diagram if entities/relations changed. Never edit a merged migration — supersede with a new one. Postgres migrations enable RLS on every table with explicit `anon` policies (the public role; saascon ships no auth).

---

## 5. UI defaults

### Layout

Mobile-first, single-column flex container that gracefully widens on desktop. Default page wrapper:

```tsx
<main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-4 md:p-6">
```

- Touch targets ≥ 44 × 44 px (`min-h-11` for buttons, `h-11 w-11` for icon-only).
- Tabular numbers for any numeric column: `tabular-nums`.
- No CSS files beyond `globals.css`. No design system. Reach for `text-*`, `bg-*`, `rounded-*`, `gap-*` and stop.

### `'use client'` budget

Default to **zero** client components. Add `'use client'` only on the actual interactive leaf:

| Need | Pattern |
|---|---|
| Form with inline error messages | ONE `'use client'` component using `useActionState` (React 19) |
| Single-knob form (settings) | Server component + redirect to `?ok=1` / `?error=invalid` |
| Re-log / delete / confirm-style buttons | Plain `<form action={serverAction}>` — server-rendered, zero client JS |

Build-size targets after v1:
- Pages with no client components: ~165–170 B First Load JS
- The one page hosting the quick-add form: ~1.0–1.3 kB First Load JS
- If a page bloats past this without a clear interactive surface, find the rogue `'use client'`.

### Accessibility primitives

- Every `<input>` wrapped in `<label>` with text. No aria-label-only labels.
- Icon-only buttons get `aria-label="<verb> <noun>"`.
- Progress bars: `role="progressbar"` + `aria-valuenow/min/max` + `aria-label`.
- `<p role="alert">` for validation errors, `<p role="status">` for success.
- Focus styling: `focus-visible:ring-2 focus-visible:ring-gray-900` (visible only on keyboard nav).
- `inputMode="numeric"` for integer fields, `inputMode="decimal"` for fractional. Pattern attrs back them up.

### Server-component form pattern (no extra `'use client'`)

When a form needs error/ok messages but you don't want a second client surface:

```tsx
// page.tsx (Server Component)
type Props = { searchParams: Promise<{ error?: string; ok?: string }> };
export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  // render form + conditional alert/status messages
}

// actions.ts
"use server";
import { redirect } from "next/navigation";
export async function action(formData: FormData) {
  if (invalid) redirect("/route?error=invalid");
  // ... do work ...
  redirect("/route?ok=1");
}
```

`redirect()` throws — anything below is unreachable, but TS narrows correctly because of `if`-branch typing.

### Premature-abstraction rule

If you build a progress bar (or any UI primitive) in two places, **don't extract it** until you have three callsites with identical surrounding markup. Two with subtly different context is fine to duplicate.

---

## 6. Commit hygiene

### Split planning from implementation

When `/spec` and `/plan` share a working tree with the first `/build` slice (T-001), don't bundle them:

1. Commit `docs: spec + plan for <project> v1` — `template/SPEC.md` + `template/tasks/plan.md` (statuses still `☐ todo`).
2. Then commit `T-001: <slice>` with the schema files + the T-001 status flip.

If `tasks/plan.md` already has a status flip mixed into planning content, **revert the flip before staging the docs commit**, commit, then re-apply the flip and include it in the slice commit.

### NEVER commit `.claude/projects/`

`.claude/projects/<id>/` holds session-local agent memory. Not product artifacts. **Never `git add` it**, even when it shows up untracked.

When staging files, prefer **explicit `git add <paths>`** over `git add -A` or `git add .` — both will sweep `.claude/projects/` in by accident.

### Slice-commit message shape

```
T-00X: <short slice title>

<1–3 short paragraphs of WHY/what changed>

- bulleted list of touched files / behaviors when there are 3+
- ...

Verified: <one-line summary of what smoke-tested green>

Co-Authored-By: <model> <noreply@anthropic.com>
```

Keep messages dense — they're the only durable explanation of why something was built. The diff already shows what.

---

## 7. Common rationalizations to refuse mid-build

- "While I'm here, let me also …" → no. New idea = new task in `tasks/plan.md` under "Out-of-plan work."
- "I'll add auth/Stripe/Resend now since the user will want it later" → no. Only when a *current* feature requires it.
- "I'll just `'use client'` the whole page so I don't have to think about it" → no. Find the actual interactive leaf.
- "I'll skip the migration file and edit `schema.sql` directly" → no. The migration is the deploy artifact.
- "I'll mock the DB in this test" → no. Integration tests use a real DB. Mocks have lied before.
- "It's just a small dep" → still costs install time, review surface, and supply-chain risk. Justify it or skip it.

When something genuinely surfaces mid-build that's relevant but out of scope, capture it as `OOP-N` in `tasks/todo.md` under "Out-of-plan discoveries." Surface to the user — don't silently expand.

---

## 8. Working-directory caveat

The harness's cwd is typically the repo root, NOT `template/`. `npm` scripts and `local.db` paths assume cwd = `template/`. **Always cd into `template/` for npm commands**, or use absolute paths for file ops on `local.db*`. Background processes started from the repo root with `cd template/ && npm run dev` work fine.

---

## 9. When (and how) to add cloud-mode deployment

Local SQLite is the saascon default. Cloud mode (Supabase + Vercel) is opt-in. The template ships **wired and ready** for both — the router pattern in `src/lib/db/queries.ts` dispatches every product query to either the SQLite or Supabase backend based on `resolveDriver()`. You don't need a separate "cloud port" slice; you implement each query on both sides as you add it.

### Lifecycle gate

The right time to flip a project to cloud:

| Stage | Action |
|---|---|
| `/spec` | Note in §8 ("External dependencies") whether cloud is in scope for v1. If unsure, default to local-only. |
| `/build` | Each product query gets implementations in **both** `queries-sqlite.ts` and `queries-supabase.ts`. Both before commit. |
| `/test` | Local SQLite path is the test target. Cloud path is verified via manual smoke against a real Supabase project, not unit tests. |
| `/review` | Confirm both backends have parity (same return shapes, same edge cases handled). Confirm RLS policies cover every write path on Supabase. |
| `/ship` | Apply Postgres migrations to your Supabase project (SQL Editor or `pg` script). Push branch. Import to Vercel with Root Directory = `template/`. Set Preview-only env vars. |

`template/docs/deploy-vercel.md` walks through the deploy specifics. Reference it from `/ship`, don't duplicate.

### Atomicity caveats — document them per query

Cloud-mode writes that need atomicity (`upsert + insert child`, `lookup + insert`, etc.) become **sequential supabase-js calls** — partial-failure window exists. Either:

- Document the failure mode in a comment above the function and accept it (single-user demo, idempotent retries fine), or
- Lift the work into a Postgres function and call via `.rpc()` for true atomicity

The SQLite path keeps single-transaction atomicity unchanged.

### When NOT to wire cloud queries upfront

- Internal-only product (no cloud deploy planned) → write the SQLite side only, leave `queries-supabase.ts` empty
- Throwaway prototype → same
- Anything where the user explicitly says "Mode: local" in their `/spec`

The unused `queries-supabase.ts` stub doesn't ship to the browser bundle (it's behind `resolveDriver()` dispatch), so leaving it empty has no runtime cost.

---

## 10. Optional AI features — Groq Cloud (demo-ready)

The template ships **Groq-ready** for any product that wants AI features during the demo (chat assistant, voice transcription, image understanding). Config lives in `template/.env.ai.example`. Default state is **off** — no Groq calls run unless a feature explicitly imports the client. Add it only when a current slice needs it.

### When to wire AI in

| Signal | Action |
|---|---|
| `/spec` mentions "AI", "chat", "transcribe", "voice note", "scan a photo of", or similar | Note in SPEC §8 ("External dependencies") that Groq is required. Plan a dedicated AI slice. |
| User says "could the demo do X with AI?" mid-build | Capture as `OOP-N` in `tasks/todo.md` — don't silently add it to the current slice. |
| Brief doesn't mention AI | Leave it out. Don't add a "while we're here" AI feature. |

### Setup (one-time per project)

1. `cat template/.env.ai.example >> template/.env`
2. Paste a Groq key from https://console.groq.com/keys into `GROQ_CLOUD_API_KEY=`
3. Defaults are verified-working — don't override unless you have a reason.

### Models available (Groq-only — no other providers)

| Capability | Model | Endpoint | Notes |
|---|---|---|---|
| Chat | `openai/gpt-oss-120b` | `/openai/v1/chat/completions` | **Reasoning model.** Set `max_tokens ≥ 200` or visible content comes back empty (tokens get spent on internal reasoning first). |
| Voice (STT) | `whisper-large-v3-turbo` | `/openai/v1/audio/transcriptions` | Multipart upload (`file=@path.wav`). |
| Image (vision input) | `meta-llama/llama-4-scout-17b-16e-instruct` | `/openai/v1/chat/completions` | Content blocks: `[{type:"text"}, {type:"image_url"}]`. Accepts URLs or `data:image/...;base64,...`. |

**Groq does NOT offer image generation.** If the brief asks for text-to-image, surface this as a blocker in `/spec` — don't silently swap in OpenAI/Replicate.

### Implementation pattern

When an AI slice lands, follow the same single-leaf rule as other client code:

- Server Action calls Groq via `fetch` against the OpenAI-compatible endpoints (no extra SDK needed — saves a dep).
- Read model IDs from `process.env.GROQ_CHAT_MODEL` etc. — never hardcode in the call site, so the `.env` stays the source of truth.
- For chat: stream only if the UI needs token-by-token rendering. For demo-grade features, non-streaming is simpler and shows up fine.
- For voice/image: accept the file at the form boundary, forward to Groq, persist the *result* (transcript, description) to the DB — don't store raw audio/images in SQLite. If they need to be kept, use the filesystem (`public/uploads/` is git-ignored).

### Demo-day caveats

- Free-tier rate limits are per-model (see `.env.ai.example` for the numbers). A live demo with rapid clicks can hit RPM ceilings — mention this if the product expects bursty usage.
- The Groq key is a secret. Same rules as `SUPABASE_SERVICE_ROLE_KEY`: server-only, never in `NEXT_PUBLIC_*`, never logged.
- Reasoning-model output (`gpt-oss-120b`) carries a `reasoning` field on the message. Render only `content`; never expose `reasoning` to users.

---

## 11. Verification — how to know a session went well

By the end of a working session:

- [ ] `npm run typecheck && npm run lint && npm run build` all green from `template/`.
- [ ] Home page renders correctly on `localhost:3000` — DB badge green.
- [ ] Every commit has a meaningful message referencing the task it addresses.
- [ ] `db/schema.sql` and `db/sqlite/schema.sql` both reflect current schema.
- [ ] `template/SPEC.md`, `template/tasks/plan.md`, `template/tasks/todo.md` reflect current reality.
- [ ] No `.claude/projects/` files committed. Run `git log --stat --all -- .claude/projects/` and expect zero output.
- [ ] Build sizes match the targets in §5 — no rogue `'use client'` surfaces.
- [ ] If aggregations exist, `grep -c '\.prepare('` over the relevant function returns 1.
- [ ] `grep -nE 'prepare\(.*\$\{|prepare\(.*\+'` over `db/` and `actions.ts` returns zero hits.

If any of these is off, fix it before declaring done.
