// Test helpers — fresh per-test SQLite DB plus utilities for planting
// entries at known wall-clock offsets. We deliberately use a real DB file
// rather than mocking; mocks have lied to us before and the schema +
// queries are the most plausible regression surface.
import Database from "better-sqlite3";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

export function makeFreshDb(): { dbPath: string; cleanup: () => void } {
  const dir = mkdtempSync(path.join(tmpdir(), "calorie-test-"));
  const dbPath = path.join(dir, "test.db");
  const conn = new Database(dbPath);
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  conn.exec(
    `create table if not exists schema_migrations (
       name text primary key,
       applied_at text not null default (datetime('now'))
     );`,
  );
  const migrationsDir = path.resolve(process.cwd(), "db/sqlite/migrations");
  for (const f of readdirSync(migrationsDir).filter((x) => x.endsWith(".sql")).sort()) {
    const sql = readFileSync(path.join(migrationsDir, f), "utf8");
    const apply = conn.transaction(() => {
      conn.exec(sql);
      conn.prepare("insert or ignore into schema_migrations (name) values (?)").run(f);
    });
    apply();
  }
  conn.close();
  return {
    dbPath,
    cleanup: () => {
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    },
  };
}

export function plantEntry(
  dbPath: string,
  opts: {
    name: string;
    calories: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    loggedAt: Date;
  },
): void {
  const conn = new Database(dbPath);
  conn
    .prepare(
      `insert into entries (id, food_id, name_snapshot, calories_snapshot,
                            protein_snapshot, carbs_snapshot, fat_snapshot, logged_at)
       values (?, NULL, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      randomUUID(),
      opts.name,
      opts.calories,
      opts.protein_g ?? null,
      opts.carbs_g ?? null,
      opts.fat_g ?? null,
      toSqliteUtc(opts.loggedAt),
    );
  conn.close();
}

export function toSqliteUtc(d: Date): string {
  const yyyy = d.getUTCFullYear().toString().padStart(4, "0");
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = d.getUTCDate().toString().padStart(2, "0");
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mi = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

// Build a Date at the given local-day offset and local hour (0–23).
export function localDateAt(daysAgo: number, hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// Point queries.ts at this test's DB. The sqlite adapter reopens its
// cached connection when SAASCON_SQLITE_PATH changes, so the next call
// into queries.* sees the right file.
export async function importQueriesAgainstDb(dbPath: string) {
  process.env.SAASCON_SQLITE_PATH = dbPath;
  return (await import("@/lib/db/queries")) as typeof import("@/lib/db/queries");
}
