// Apply Postgres migrations against your Supabase project programmatically.
// Used only for cloud mode. Local SQLite migrations apply automatically
// on first `npm run dev` request (see src/lib/db/sqlite.ts).
//
// Prerequisites:
//   - DATABASE_URL set in .env (Supabase dashboard → Connect →
//     Connection string → URI → Session pooler)
//   - pg + @types/pg installed as devDeps (already in this template)
//
// Usage (from template/):
//   npm run migrate
//
// Each migration runs in its own transaction. A failure rolls back
// that file and stops the run; previously-applied migrations stay.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const env = (() => {
  const file = path.resolve(process.cwd(), ".env");
  if (!existsSync(file)) return {} as Record<string, string>;
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const eq = l.indexOf("=");
        return [l.slice(0, eq), l.slice(eq + 1)] as const;
      }),
  ) as Record<string, string>;
})();

const url = process.env.DATABASE_URL ?? env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env or export it.");
  console.error("Get it from Supabase dashboard → Connect → Connection string → URI → Session pooler.");
  process.exit(1);
}

const migrationsDir = path.resolve(process.cwd(), "db/migrations");
if (!existsSync(migrationsDir)) {
  console.error(`db/migrations directory not found at ${migrationsDir}`);
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("No migration files found. Nothing to do.");
  process.exit(0);
}

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15_000,
});

await client.connect();
console.log("✓ connected");

// Track applied migrations in a metadata table so a re-run is a no-op.
await client.query(`
  create table if not exists schema_migrations (
    name        text primary key,
    applied_at  timestamptz not null default now()
  );
`);

const applied = new Set(
  (await client.query<{ name: string }>("select name from schema_migrations")).rows.map((r) => r.name),
);

let appliedThisRun = 0;
for (const name of files) {
  if (applied.has(name)) {
    console.log(`  · ${name} (already applied, skipping)`);
    continue;
  }
  const sql = readFileSync(path.join(migrationsDir, name), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into schema_migrations (name) values ($1)", [name]);
    await client.query("commit");
    console.log(`  ✓ ${name}`);
    appliedThisRun++;
  } catch (e) {
    await client.query("rollback").catch(() => {});
    console.error(`  ✗ ${name} FAILED:`, (e as Error).message);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log(
  appliedThisRun === 0
    ? "\nAll migrations already applied — nothing new."
    : `\n✅ Applied ${appliedThisRun} new migration${appliedThisRun === 1 ? "" : "s"}.`,
);
