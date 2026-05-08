// Server-side Supabase health probe. Used by the home page so a fresh clone
// shows DB connectivity status immediately on first load.
//
// Three states:
//   - "connected": probe succeeded (env wired + schema present)
//   - "schema-missing": Supabase responded but the `examples` table is gone,
//     which is the expected state once a cloned project replaces the example
//     migration with real entities. Still a green light for "Supabase wired".
//   - "unreachable": env missing or network/auth error
import { getServerSupabase } from "./server";

export type SupabaseHealth =
  | { status: "connected"; rowCount: number }
  | { status: "schema-missing"; reason: string }
  | { status: "unreachable"; reason: string };

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  let supabase;
  try {
    supabase = getServerSupabase();
  } catch (e) {
    return { status: "unreachable", reason: (e as Error).message };
  }

  const { count, error } = await supabase
    .from("examples")
    .select("*", { count: "exact", head: true });

  if (error) {
    if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
      return { status: "schema-missing", reason: error.message };
    }
    return { status: "unreachable", reason: error.message };
  }

  return { status: "connected", rowCount: count ?? 0 };
}
