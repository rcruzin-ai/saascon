// SQLite implementations of product queries. Used in local mode.
//
// Pattern:
//   - Import getSqliteConnection from ./sqlite for the cached connection.
//   - Use prepared statements directly (`conn.prepare(...).all(...)`).
//   - Every value passes through a `?` placeholder — never string-interpolate.
//   - Identifiers (table/column names) are hard-coded.
//   - For multi-statement work, wrap in `conn.transaction(() => { ... })`.
//
// Pair every function added here with a sibling in queries-supabase.ts
// returning the same shape — the router in queries.ts dispatches by
// driver, and the TypeScript signature catches drift.
//
// Example (replace with your real queries):
//
//   import { randomUUID } from "node:crypto";
//   import { getSqliteConnection } from "./sqlite";
//   import type { ExampleRow, ExampleInput } from "./queries-types";
//
//   export function listExamples(): ExampleRow[] {
//     return getSqliteConnection()
//       .prepare(`select id, label, created_at from examples order by created_at desc`)
//       .all() as ExampleRow[];
//   }
//
//   export function createExample(input: ExampleInput): { id: string } {
//     const id = randomUUID();
//     getSqliteConnection()
//       .prepare(`insert into examples (id, label) values (?, ?)`)
//       .run(id, input.label);
//     return { id };
//   }

// (no queries yet — add yours here)
export {};
