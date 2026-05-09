// Idempotent dev seed. Plants a few foods + today's entries the first time
// per process when the entries table is empty. So a fresh `npm run dev` has
// something to render without forcing the user to log first.
//
// Memoized: subsequent calls are no-ops within the same Node process.
// The empty-table guard is the durable safety net across process restarts.

import { randomUUID } from "node:crypto";
import { getSqliteConnection } from "./sqlite";

let checked = false;

type SeedFood = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  loggedAtMinutesAgo: number;
};

const SEED: SeedFood[] = [
  { name: "Oatmeal with banana", calories: 320, protein_g: 10, carbs_g: 60, fat_g: 5, loggedAtMinutesAgo: 480 },
  { name: "Greek yogurt", calories: 150, protein_g: 17, carbs_g: 9, fat_g: 4, loggedAtMinutesAgo: 240 },
  { name: "Chicken sandwich", calories: 480, protein_g: 32, carbs_g: 45, fat_g: 18, loggedAtMinutesAgo: 60 },
];

export function seedDev(): void {
  if (checked) return;
  checked = true;

  const conn = getSqliteConnection();
  const { c } = conn.prepare(`select count(*) as c from entries`).get() as { c: number };
  if (c > 0) return;

  const insertFood = conn.prepare(
    `insert into foods (id, name, calories, protein_g, carbs_g, fat_g)
     values (?, ?, ?, ?, ?, ?)
     on conflict (lower(name)) do update set
       calories  = excluded.calories,
       protein_g = excluded.protein_g,
       carbs_g   = excluded.carbs_g,
       fat_g     = excluded.fat_g
     returning id`,
  );

  const insertEntry = conn.prepare(
    `insert into entries (id, food_id, name_snapshot, calories_snapshot,
                          protein_snapshot, carbs_snapshot, fat_snapshot, logged_at)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const seed = conn.transaction(() => {
    for (const f of SEED) {
      const newId = randomUUID();
      const row = insertFood.get(newId, f.name, f.calories, f.protein_g, f.carbs_g, f.fat_g) as {
        id: string;
      };
      const loggedAt = sqliteUtcMinutesAgo(f.loggedAtMinutesAgo);
      insertEntry.run(
        randomUUID(),
        row.id,
        f.name,
        f.calories,
        f.protein_g,
        f.carbs_g,
        f.fat_g,
        loggedAt,
      );
    }
  });

  seed();
}

function sqliteUtcMinutesAgo(minutes: number): string {
  const d = new Date(Date.now() - minutes * 60_000);
  const yyyy = d.getUTCFullYear().toString().padStart(4, "0");
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = d.getUTCDate().toString().padStart(2, "0");
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mi = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}
