// Shared row + input types used by both queries-sqlite.ts and
// queries-supabase.ts. Lives outside the two backend modules so product
// code (and the router) can `import type` without pulling either driver
// into its bundle.
//
// The TypeScript signature on queries.ts catches drift: if the SQLite
// and Supabase versions of a query disagree on return type, the file
// fails to type-check.

// ─────────────────────────────────────────────────────────────────────
// Example placeholder types — backed by the saascon `examples` table.
// Delete these when you replace `examples` with your real entities;
// add your real types in their place.
// ─────────────────────────────────────────────────────────────────────

export type ExampleRow = {
  id: string;
  label: string;
  created_at: string;
};

export type ExampleInput = {
  label: string;
};
