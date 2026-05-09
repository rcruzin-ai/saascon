// Server-side DB health probe. Used by the home page so a fresh clone shows
// connectivity status immediately on first load. Works against either backend
// (Supabase or local SQLite) — the routing happens in src/lib/db/index.ts.
//
// Probe target is the `settings` singleton: it is seeded with one row by the
// schema migration, so "connected" implies the schema is fully applied.
//
// States:
//   - "connected": probe succeeded (env wired + schema present, settings row found)
//   - "schema-missing": DB responded but the `settings` table is gone
//   - "unreachable": env missing or network/auth error
import { getDb, resolveDriver, type DbDriver } from "../db";

export type SupabaseHealth =
  | { status: "connected"; driver: DbDriver; rowCount: number }
  | { status: "schema-missing"; driver: DbDriver; reason: string }
  | { status: "unreachable"; driver: DbDriver; reason: string };

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const driver = resolveDriver();
  let db;
  try {
    db = getDb();
  } catch (e) {
    return { status: "unreachable", driver, reason: (e as Error).message };
  }

  const result = await db.countRows("settings");
  if ("count" in result) return { status: "connected", driver, rowCount: result.count };
  if ("missing" in result)
    return { status: "schema-missing", driver, reason: "settings table not found" };
  return { status: "unreachable", driver, reason: result.error };
}
