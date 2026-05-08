// SQLite adapter for the Db interface. Backed by better-sqlite3 against
// the file at SAASCON_SQLITE_PATH (default ./local.db).
//
// Auto-initializes on first connection: if the DB file is missing or the
// schema_migrations table is empty, every file in db/sqlite/migrations/ is
// applied in lexicographic order. Fresh clones therefore work with just
// `npm install && npm run dev` — no setup commands required.
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Db, Row } from "./index";

let cached: Database.Database | undefined;
const MIGRATIONS_DIR = path.resolve(process.cwd(), "db/sqlite/migrations");

function getConnection(): Database.Database {
  if (cached) return cached;
  const dbPath = path.resolve(process.env.SAASCON_SQLITE_PATH ?? "./local.db");
  cached = new Database(dbPath, { readonly: false });
  cached.pragma("journal_mode = WAL");
  cached.pragma("foreign_keys = ON");
  applyPendingMigrations(cached);
  return cached;
}

function applyPendingMigrations(conn: Database.Database): void {
  conn.exec(
    `create table if not exists schema_migrations (
       name        text primary key,
       applied_at  text not null default (datetime('now'))
     );`,
  );

  if (!existsSync(MIGRATIONS_DIR)) return;

  const applied = new Set(
    (conn.prepare("select name from schema_migrations").all() as Array<{ name: string }>).map(
      (r) => r.name,
    ),
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const apply = conn.transaction((file: string) => {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    conn.exec(sql);
    conn.prepare("insert into schema_migrations (name) values (?)").run(file);
  });

  for (const file of files) {
    if (applied.has(file)) continue;
    try {
      apply(file);
    } catch (e) {
      throw new Error(`Failed to apply SQLite migration ${file}: ${(e as Error).message}`);
    }
  }
}

function isMissingTableError(message: string): boolean {
  return /no such table/i.test(message);
}

export function createSqliteDb(): Db {
  const conn = getConnection();
  return {
    driver: "sqlite",
    async countRows(table) {
      try {
        const row = conn.prepare(`select count(*) as c from ${quoteIdent(table)}`).get() as
          | { c: number }
          | undefined;
        return { count: row?.c ?? 0 };
      } catch (e) {
        const msg = (e as Error).message;
        if (isMissingTableError(msg)) return { missing: true };
        return { error: msg };
      }
    },
    async selectRecent(table, orderBy, limit) {
      const sql = `select * from ${quoteIdent(table)} order by ${quoteIdent(orderBy)} desc limit ?`;
      return conn.prepare(sql).all(limit) as unknown as Row[];
    },
    async insertOne(table, row) {
      const withId = "id" in row ? row : { id: randomUUID(), ...row };
      const cols = Object.keys(withId);
      const placeholders = cols.map(() => "?").join(", ");
      const sql = `insert into ${quoteIdent(table)} (${cols.map(quoteIdent).join(", ")}) values (${placeholders}) returning *`;
      return conn.prepare(sql).get(...Object.values(withId)) as unknown as Row;
    },
  };
}

function quoteIdent(name: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  return `"${name}"`;
}
