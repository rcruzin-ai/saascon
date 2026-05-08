// Server-side DB health probe. Used by the home page so a fresh clone shows
// connectivity status immediately on first load. Works against either backend
// (Supabase or local SQLite) — the routing happens in src/lib/db/index.ts.
//
// States:
//   - "connected": probe succeeded (env wired + schema present)
//   - "schema-missing": DB responded but the `examples` table is gone, which
//     is the expected state once a cloned project replaces the example
//     migration with real entities. Still a green light for "DB wired".
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

  const result = await db.countRows("examples");
  if ("count" in result) return { status: "connected", driver, rowCount: result.count };
  if ("missing" in result)
    return { status: "schema-missing", driver, reason: "examples table not found" };
  return { status: "unreachable", driver, reason: result.error };
}
