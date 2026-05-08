// Supabase adapter for the Db interface. Wraps the existing server client.
import { getServerSupabase } from "../supabase/server";
import type { Db, Row } from "./index";

export function createSupabaseDb(): Db {
  const supabase = getServerSupabase();
  return {
    driver: "supabase",
    async countRows(table) {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) {
        if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
          return { missing: true };
        }
        return { error: error.message };
      }
      return { count: count ?? 0 };
    },
    async selectRecent(table, orderBy, limit) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(orderBy, { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Row[];
    },
    async insertOne(table, row) {
      const { data, error } = await supabase.from(table).insert(row).select().single();
      if (error) throw new Error(error.message);
      return data as unknown as Row;
    },
  };
}
