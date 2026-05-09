// Optional dev seed. Plants a few rows the first time per Node process
// when the relevant table is empty — so a fresh `npm run dev` has
// something to render without forcing the user to write data first.
//
// Pattern:
//   - Memoized via a module-level `checked` flag (single guard per process).
//   - Empty-table guard is the durable safety net across process restarts —
//     a populated DB never gets re-seeded.
//   - Wrap multiple inserts in `conn.transaction(() => { ... })`.
//
// Fire it from src/app/page.tsx (or whichever route renders first) when
// `resolveDriver() === "sqlite"`. Cloud mode does not seed via app code —
// seed cloud projects from the SQL Editor or a one-off script.
//
// Example (replace with your real seed):
//
//   import { randomUUID } from "node:crypto";
//   import { getSqliteConnection } from "./sqlite";
//
//   let checked = false;
//
//   export function seedDev(): void {
//     if (checked) return;
//     checked = true;
//
//     const conn = getSqliteConnection();
//     const { c } = conn.prepare(`select count(*) as c from examples`).get() as { c: number };
//     if (c > 0) return;
//
//     const insert = conn.prepare(
//       `insert into examples (id, label) values (?, ?)`,
//     );
//     const seed = conn.transaction(() => {
//       insert.run(randomUUID(), "first example");
//       insert.run(randomUUID(), "second example");
//     });
//     seed();
//   }

// (no seed yet — fill in when you have tables to seed)
export function seedDev(): void {
  // intentionally empty in the saascon scaffold
}
