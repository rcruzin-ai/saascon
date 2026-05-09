// Optional dev seed. Plants a row in the `examples` table the first
// time per Node process when the table is empty — so a fresh `npm run dev`
// has something to render via the health probe.
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

import { randomUUID } from "node:crypto";
import { getSqliteConnection } from "./sqlite";

let checked = false;

export function seedDev(): void {
  if (checked) return;
  checked = true;

  const conn = getSqliteConnection();
  const { c } = conn.prepare(`select count(*) as c from examples`).get() as { c: number };
  if (c > 0) return;

  conn
    .prepare(`insert into examples (id, label) values (?, ?)`)
    .run(randomUUID(), "saascon local mode active");
}
