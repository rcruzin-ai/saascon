// Supabase implementations of product queries. Used in cloud mode.
//
// Atomicity differences vs. SQLite (worth documenting per query):
//   - SQLite single-transaction blocks (`conn.transaction`) become
//     sequential supabase-js calls. Failure mode: partial state. Either
//     accept it (single-user demo) or lift the work into a Postgres
//     function and call via .rpc().
//   - SQLite `on conflict (lower(name)) do update` maps to
//     .upsert(..., { onConflict: "<col>" }) — but the conflict column
//     must be a real column or a generated stored column. A naked
//     expression index (`unique index on lower(name)`) won't work
//     with the supabase-js builder; add a `name_lower text generated
//     always as (lower(name)) stored` column with its own unique index.
//
// Pair every function added here with a sibling in queries-sqlite.ts
// returning the same shape.

import { getServerSupabase } from "../supabase/server";
import type { ExampleInput, ExampleRow } from "./queries-types";

// ─────────────────────────────────────────────────────────────────────
// Example placeholder queries — backed by the saascon `examples` table.
// Delete these when you replace `examples` with your real entities.
// ─────────────────────────────────────────────────────────────────────

export async function listExamples(): Promise<ExampleRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("examples")
    .select("id, label, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    label: r.label,
    // Postgres returns timestamptz as ISO 8601 with timezone;
    // normalize to a simple ISO string for parity with SQLite's
    // datetime() output (which is "YYYY-MM-DD HH:MM:SS" UTC, no Z).
    created_at: typeof r.created_at === "string" ? r.created_at : new Date(r.created_at).toISOString(),
  }));
}

export async function createExample(input: ExampleInput): Promise<{ id: string }> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("examples")
    .insert({ label: input.label })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function deleteExampleById(id: string): Promise<{ changes: number }> {
  const supabase = getServerSupabase();
  const { error, count } = await supabase
    .from("examples")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { changes: count ?? 0 };
}
