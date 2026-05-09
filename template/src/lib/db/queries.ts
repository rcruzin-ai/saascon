// Product queries router. Dispatches every call to queries-sqlite.ts or
// queries-supabase.ts based on resolveDriver() (see ./index.ts).
//
// Every product query is exposed as **async** here so consumers don't
// need to know which backend is active. Local SQLite functions are
// synchronous; the router awaits them — a no-op in practice.
//
// To add a new query:
//   1. Add the row + input types in ./queries-types.ts.
//   2. Implement in ./queries-sqlite.ts (synchronous, prepared statements).
//   3. Implement in ./queries-supabase.ts (async, supabase-js).
//   4. Add the dispatch wrapper here.
//
// The TypeScript signature catches drift: if the SQLite and Supabase
// versions return different shapes, this file fails to type-check.

import { resolveDriver } from "./index";
import * as sqliteImpl from "./queries-sqlite";
import * as supabaseImpl from "./queries-supabase";
import type { ExampleInput } from "./queries-types";

export type * from "./queries-types";

// Active backend at the time of call. `resolveDriver()` re-reads the
// environment, so flipping SAASCON_DB_DRIVER between requests works.
function isCloud(): boolean {
  return resolveDriver() === "supabase";
}

// ─────────────────────────────────────────────────────────────────────
// Example placeholder dispatchers. Delete when replacing `examples`.
// ─────────────────────────────────────────────────────────────────────

export async function listExamples() {
  return isCloud() ? supabaseImpl.listExamples() : sqliteImpl.listExamples();
}

export async function createExample(input: ExampleInput) {
  return isCloud() ? supabaseImpl.createExample(input) : sqliteImpl.createExample(input);
}

export async function deleteExampleById(id: string) {
  return isCloud() ? supabaseImpl.deleteExampleById(id) : sqliteImpl.deleteExampleById(id);
}
