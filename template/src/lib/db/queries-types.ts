// Shared row + input types used by both queries-sqlite.ts and
// queries-supabase.ts. Lives outside the two backend modules so product
// code (and the router) can `import type` without pulling either driver
// into its bundle.
//
// As you add product entities, add their types here. Both backend
// modules then reference the same shape, so a query that exists on
// SQLite must also exist on Supabase with the same return type — the
// router's TypeScript signature will catch drift.
//
// Example (replace with your real entities):
//
//   export type ExampleRow = {
//     id: string;
//     label: string;
//     created_at: string;
//   };
//
//   export type ExampleInput = {
//     label: string;
//   };

// (no types yet — add yours here)
export {};
