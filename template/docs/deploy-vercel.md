# Deploying the calorie tracker to Vercel (preview mode)

> Local SQLite mode runs on `npm run dev`. To deploy to Vercel you need to switch to **cloud mode** (Supabase). Vercel's serverless functions have a read-only filesystem, so `better-sqlite3` writing to `./local.db` won't work.
>
> The router in `src/lib/db/queries.ts` picks the backend based on env vars: when `NEXT_PUBLIC_SUPABASE_URL` is set, the Supabase implementation is used.

---

## 1. Apply the schema to your Supabase project

In the Supabase dashboard: **SQL Editor → New query**. Paste each migration in order, run it.

```text
db/migrations/20260508082135__example_table.sql
db/migrations/20260509064922__drop_examples.sql
db/migrations/20260509064923__create_calorie_tracker.sql
db/migrations/20260509074448__cloud_anon_write_policies.sql
db/migrations/20260509075018__foods_name_lower_generated.sql
```

After each: confirm success in the result panel. After the last one, run a sanity check:

```sql
select count(*) from settings;        -- expect 1
select count(*) from foods;           -- expect 0
select count(*) from entries;         -- expect 0
select column_name from information_schema.columns
  where table_name = 'foods' and column_name = 'name_lower';  -- expect 1 row
```

If all four pass the cloud DB is ready.

## 2. Set the timezone you want "today" to roll over in

Cloud mode reads `NEXT_PUBLIC_TIMEZONE` for the today/history boundary. Examples:

- `Asia/Manila`
- `America/Los_Angeles`
- `Europe/London`
- `UTC` (default if unset — fine if you're in UTC)

Use any IANA zone name. The browser's own timezone doesn't matter — server renders against this single value.

## 3. Push your branch

```bash
git push -u origin preview/calorie-tracker
```

## 4. Import the project into Vercel

In the Vercel dashboard:

1. **Add New → Project**.
2. Import the GitHub repo.
3. **Important — set Root Directory to `template/`**. Vercel needs to find `package.json` here, not at the repo root.
4. **Framework Preset: Next.js** (autodetected).
5. Don't deploy yet — go to **Environment Variables** first.

## 5. Set environment variables — Preview only, NOT Production

In **Settings → Environment Variables**, add the following with **Preview** checked and **Production** unchecked:

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` | Found in Supabase **Project settings → API → Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG…` | Same screen, **anon public** key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG…` | Same screen, **service_role** key. **Server-only — never reaches the browser bundle.** |
| `NEXT_PUBLIC_TIMEZONE` | e.g. `Asia/Manila` | IANA zone for the today/history boundary |

**Why preview-only:** if production gets these vars, a future merge to `main` would auto-deploy to a public production URL. Keeping them out of production means production is just a parked URL until you deliberately promote.

## 6. Deploy

Vercel deploys the branch as a preview URL like `https://saascon-git-preview-calorie-tracker-<your-team>.vercel.app/`. The first deploy takes ~1 minute.

## 7. Smoke-test the preview URL

- Open the URL → DB badge should be green: "Supabase connected · settings reachable · 1 row".
- Quick-add a food → entry appears, totals update, progress bar advances.
- Visit `/foods` → the food you just added is listed.
- Tap **Log again** on it → another entry appears on `/`.
- Visit `/history` → today's row matches today's totals.
- Visit `/settings` → change daily target → return to `/` → progress bar denominator changed.
- Delete an entry on `/` → totals shrink.

If the badge is red:

- "schema-missing" → step 1 didn't apply all migrations. Re-run.
- "not configured" → env vars on the wrong environment. Re-check Preview is checked.

If writes fail with RLS errors → step 1's `cloud_anon_write_policies` migration didn't run.

## 8. Reverting

To go back to local-only development at any time, just don't set `NEXT_PUBLIC_SUPABASE_URL` in your local `.env`. The router falls back to SQLite automatically.
