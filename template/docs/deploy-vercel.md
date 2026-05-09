# Deploying a saascon project to Vercel

> Local SQLite mode runs on `npm run dev` with zero external services. To deploy to Vercel you need to switch to **cloud mode** (Supabase). Vercel's serverless functions have a read-only filesystem, so `better-sqlite3` writing to `./local.db` won't work in production.
>
> The router in `src/lib/db/index.ts` picks the backend based on env vars: when `NEXT_PUBLIC_SUPABASE_URL` is set, the Supabase implementation is used.

---

## Prerequisites

- A Supabase project (free tier is fine)
- A Vercel account linked to the GitHub repo
- Your product's schema migrations under `template/db/migrations/` (Postgres dialect, RLS policies on every table)

## 1. Apply the schema to your Supabase project

The fastest path is the Supabase **SQL Editor**:

1. Open https://supabase.com/dashboard → your project → **SQL Editor** in the left sidebar → **+ New query**
2. For each migration file in `template/db/migrations/` (in lexicographic order — they're timestamped): copy the SQL, paste, click **Run**
3. Verify success in the result panel after each one

For repeatable migrations, you can also run them programmatically with the `pg` Node client. Example pattern (requires `DATABASE_URL` from Project Settings → Database → Connection pooling):

```bash
npm install --save-dev pg @types/pg
```

```ts
// scripts/migrate.mts
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const url = process.env.DATABASE_URL!;
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

for (const f of readdirSync("db/migrations").filter(n => n.endsWith(".sql")).sort()) {
  const sql = readFileSync(path.join("db/migrations", f), "utf8");
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query("commit");
    console.log("✓", f);
  } catch (e) {
    await client.query("rollback");
    throw e;
  }
}

await client.end();
```

After applying migrations, sanity-check by listing the tables that ended up in `public`:

```sql
select table_name from information_schema.tables where table_schema='public' order by table_name;
```

## 2. Set the timezone you want day boundaries to roll at

Cloud mode reads `NEXT_PUBLIC_TIMEZONE` from the environment. Examples:

- `Asia/Manila`
- `America/Los_Angeles`
- `Europe/London`
- `UTC` (default if unset)

Use any IANA zone name. The browser's own timezone doesn't matter — server renders against this single value.

## 3. Push your branch

```bash
git push -u origin <your-feature-branch>
```

## 4. Import the project into Vercel

In the Vercel dashboard:

1. **Add New → Project**
2. Import the GitHub repo
3. **Important — set Root Directory to `template/`**. Vercel needs to find `package.json` here, not at the repo root.
4. **Framework Preset: Next.js** (autodetected)
5. Don't deploy yet — go to **Environment Variables** first

## 5. Set environment variables — Preview only, NOT Production

In **Settings → Environment Variables**, add the following with **Preview** checked and **Production** unchecked:

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` | Found in Supabase **Project settings → API → Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG…` | Same screen, **anon public** key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG…` | Same screen, **service_role** key. **Server-only — never reaches the browser bundle.** |
| `NEXT_PUBLIC_TIMEZONE` | e.g. `Asia/Manila` | IANA zone for any day-boundary logic |

**Why preview-only:** if production gets these vars, a future merge to `main` would auto-deploy to a public production URL. Keeping them out of production means production is just a parked URL until you deliberately promote.

`DATABASE_URL` is **not** needed at runtime — only for the migration script in step 1.

## 6. Deploy

Vercel deploys the branch as a preview URL like `https://<project>-git-<branch>-<your-team>.vercel.app/`. The first deploy takes ~1 minute.

## 7. Smoke-test the preview URL

Open the URL → DB health badge should be green:

> "Supabase connected · <table> reachable · N row(s)"

If the badge is red or yellow:

| State | Meaning | Fix |
|---|---|---|
| Yellow ("schema-missing") | DB reachable but the probe table doesn't exist | Re-check step 1; the migrations didn't all apply |
| Red ("not configured") | Env vars missing or wrong | Step 5 — confirm Preview is checked, redeploy |
| RLS errors on first write | `anon` role lacks insert/update/delete on the affected table | Add appropriate `create policy "anon insert <table>" … with check (true)` migrations |

## 8. Reverting to local-only

To go back to local SQLite development at any time, just don't set `NEXT_PUBLIC_SUPABASE_URL` in your local `.env`. The router falls back to SQLite automatically. Or copy `.env.local.example` over `.env`.

## 9. Locking down the preview URL

Vercel preview URLs are publicly accessible by default. For non-public previews:

- Vercel project → **Settings → Deployment Protection** → enable **Vercel Authentication** for previews
- Anyone visiting must log in to their Vercel account first
- No code changes; standard for non-public demos

---

## Common gotchas

- **Root Directory left at repo root** → build fails because `package.json` is in `template/`
- **Forgot the database password during `DATABASE_URL` setup** → reset it in Project Settings → Database; this invalidates any existing connections
- **Special characters in DB password break `DATABASE_URL`** → URL-encode (`@` → `%40`, etc.) or reset to a simpler password
- **`NEXT_PUBLIC_TIMEZONE` unset on Vercel** → day boundaries roll at UTC midnight; users in non-UTC zones see "today" change at the wrong wall-clock time
- **`.env` committed accidentally** → secrets are in git history; rotate the keys immediately
