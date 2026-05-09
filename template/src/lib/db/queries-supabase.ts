// Supabase implementations of product queries. Used in cloud mode.
//
// Atomicity differences vs. SQLite (worth documenting per query):
//   - SQLite single-transaction blocks (`conn.transaction`) become
//     sequential supabase-js calls. Failure mode: partial state. Either
//     accept it (single-user demo) or lift the work into a Postgres
//     function and call via .rpc().
//   - SQLite `on conflict` upserts map to .upsert({...}, { onConflict: "<col>" }).
//     The conflict column needs to exist as a real column or unique index
//     on a real column — Supabase's REST builder can't target an
//     expression index like `lower(name)` directly. Use a generated
//     column when you need case-insensitive matching.
//
// Pair every function added here with a sibling in queries-sqlite.ts
// returning the same shape — the router in queries.ts dispatches by
// driver, and the TypeScript signature catches drift.
//
// Example (replace with your real queries):
//
//   import { getServerSupabase } from "../supabase/server";
//   import type { ExampleRow, ExampleInput } from "./queries-types";
//
//   export async function listExamples(): Promise<ExampleRow[]> {
//     const supabase = getServerSupabase();
//     const { data, error } = await supabase
//       .from("examples")
//       .select("id, label, created_at")
//       .order("created_at", { ascending: false });
//     if (error) throw new Error(error.message);
//     return (data ?? []) as ExampleRow[];
//   }
//
//   export async function createExample(input: ExampleInput): Promise<{ id: string }> {
//     const supabase = getServerSupabase();
//     const { data, error } = await supabase
//       .from("examples")
//       .insert({ label: input.label })
//       .select("id")
//       .single();
//     if (error) throw new Error(error.message);
//     return { id: data.id };
//   }

// (no queries yet — add yours here)
export {};
