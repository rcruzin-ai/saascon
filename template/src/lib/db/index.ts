// Database routing layer. Picks the backend based on environment:
//
//   - "sqlite" (default for fresh clones): local file, zero external services.
//     Auto-initializes on first query — no setup commands needed.
//   - "supabase": cloud Postgres via @supabase/supabase-js. Active when
//     NEXT_PUBLIC_SUPABASE_URL is set, OR SAASCON_DB_DRIVER=supabase.
//
// To force a mode, set SAASCON_DB_DRIVER=sqlite|supabase in `.env`.
//
// The interface is intentionally tiny — only what saascon actually uses.
// If you need joins, transactions, realtime, or auth, you'll need to either
// (a) extend this interface in both adapters, or (b) drop the abstraction
// and import the underlying client directly. Don't grow this layer beyond
// what your features genuinely need.
export type DbDriver = "supabase" | "sqlite";

export type Row = Record<string, unknown>;

export type Db = {
  driver: DbDriver;
  /** SELECT count(*) FROM <table>. Returns row count, or marker if table missing. */
  countRows(
    table: string,
  ): Promise<{ count: number } | { missing: true } | { error: string }>;
  /** SELECT * FROM <table> ORDER BY <orderBy> DESC LIMIT <limit>. */
  selectRecent(table: string, orderBy: string, limit: number): Promise<Row[]>;
  /** INSERT INTO <table> (...) VALUES (...). Returns the inserted row. */
  insertOne(table: string, row: Row): Promise<Row>;
};

export function resolveDriver(): DbDriver {
  const explicit = process.env.SAASCON_DB_DRIVER;
  if (explicit === "supabase" || explicit === "sqlite") return explicit;
  return process.env.NEXT_PUBLIC_SUPABASE_URL ? "supabase" : "sqlite";
}

export function getDb(): Db {
  if (resolveDriver() === "sqlite") {
    const { createSqliteDb } = require("./sqlite") as typeof import("./sqlite");
    return createSqliteDb();
  }
  const { createSupabaseDb } = require("./supabase") as typeof import("./supabase");
  return createSupabaseDb();
}
