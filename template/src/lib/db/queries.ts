// Product-level SQL for the calorie tracker. Uses prepared statements
// directly against the cached SQLite connection — see sqlite.ts for why
// we don't extend the tiny Db interface.
//
// Every value passes through a `?` placeholder. Identifiers are hard-coded.

import { randomUUID } from "node:crypto";
import { getSqliteConnection } from "./sqlite";

export type EntryRow = {
  id: string;
  food_id: string | null;
  name_snapshot: string;
  calories_snapshot: number;
  protein_snapshot: number | null;
  carbs_snapshot: number | null;
  fat_snapshot: number | null;
  logged_at: string;
};

export type TodayTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

// SQLite stores datetime('now') as UTC strings of shape "YYYY-MM-DD HH:MM:SS"
// (no trailing Z). We build [startUtc, endUtc) from the user's local "today"
// boundaries so a single-user app shows the right day at the right time.
export function todayUtcRange(now: Date = new Date()): { startUtc: string; endUtc: string } {
  const startLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return { startUtc: toSqliteUtc(startLocal), endUtc: toSqliteUtc(endLocal) };
}

function toSqliteUtc(d: Date): string {
  const yyyy = d.getUTCFullYear().toString().padStart(4, "0");
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = d.getUTCDate().toString().padStart(2, "0");
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mi = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export function getEntriesForToday(now: Date = new Date()): EntryRow[] {
  const { startUtc, endUtc } = todayUtcRange(now);
  return getSqliteConnection()
    .prepare(
      `select id, food_id, name_snapshot, calories_snapshot,
              protein_snapshot, carbs_snapshot, fat_snapshot, logged_at
       from entries
       where logged_at >= ? and logged_at < ?
       order by logged_at desc`,
    )
    .all(startUtc, endUtc) as EntryRow[];
}

export function getTodayTotals(now: Date = new Date()): TodayTotals {
  const { startUtc, endUtc } = todayUtcRange(now);
  const row = getSqliteConnection()
    .prepare(
      `select coalesce(sum(calories_snapshot), 0) as calories,
              coalesce(sum(protein_snapshot),  0) as protein_g,
              coalesce(sum(carbs_snapshot),    0) as carbs_g,
              coalesce(sum(fat_snapshot),      0) as fat_g
       from entries
       where logged_at >= ? and logged_at < ?`,
    )
    .get(startUtc, endUtc) as TodayTotals;
  return row;
}

// Upsert a food by case-insensitive name and log an entry in one transaction.
// Catalog row keeps the latest macros (excluded.* on conflict). The new
// entry snapshots those same values at log time — editing the food later
// does NOT change historical totals (FR-3 in SPEC.md).
export type LogInput = {
  name: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

export function upsertFoodAndLogEntry(input: LogInput): { foodId: string; entryId: string } {
  const conn = getSqliteConnection();
  const upsertFood = conn.prepare(
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
                          protein_snapshot, carbs_snapshot, fat_snapshot)
     values (?, ?, ?, ?, ?, ?, ?)
     returning id`,
  );

  const tx = conn.transaction(() => {
    const food = upsertFood.get(
      randomUUID(),
      input.name,
      input.calories,
      input.protein_g,
      input.carbs_g,
      input.fat_g,
    ) as { id: string };
    const entry = insertEntry.get(
      randomUUID(),
      food.id,
      input.name,
      input.calories,
      input.protein_g,
      input.carbs_g,
      input.fat_g,
    ) as { id: string };
    return { foodId: food.id, entryId: entry.id };
  });

  return tx();
}

export type FoodRow = {
  id: string;
  name: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  created_at: string;
};

export function listFoods(): FoodRow[] {
  return getSqliteConnection()
    .prepare(
      `select id, name, calories, protein_g, carbs_g, fat_g, created_at
       from foods
       order by created_at desc, name asc`,
    )
    .all() as FoodRow[];
}

// Re-log an existing food: snapshot its current catalog values onto a new
// entry. One INSERT, no extra SELECT — the values come from a sub-select
// keyed on the foreign-key id, so a missing food just yields zero rows.
export function relogFromFoodId(foodId: string): { entryId: string } | null {
  const conn = getSqliteConnection();
  const newId = randomUUID();
  const row = conn
    .prepare(
      `insert into entries (id, food_id, name_snapshot, calories_snapshot,
                            protein_snapshot, carbs_snapshot, fat_snapshot)
       select ?, id, name, calories, protein_g, carbs_g, fat_g
       from foods where id = ?
       returning id`,
    )
    .get(newId, foodId) as { id: string } | undefined;
  return row ? { entryId: row.id } : null;
}

export type DayTotals = {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

// Last `days` days (inclusive of today). ONE aggregate query against
// entries; JS fills any missing days with zeros so the view always
// renders a fixed-width window.
//
// `date(logged_at, 'localtime')` groups by the user's local day, matching
// the today-view's TZ behavior in todayUtcRange().
export function getHistoryLastNDays(days: number, now: Date = new Date()): DayTotals[] {
  const cutoff = startOfLocalDay(addDays(now, -(days - 1)));
  const cutoffIso = toLocalDateString(cutoff);

  const rows = getSqliteConnection()
    .prepare(
      `select date(logged_at, 'localtime')          as d,
              sum(calories_snapshot)                as cal,
              sum(coalesce(protein_snapshot, 0))    as prot,
              sum(coalesce(carbs_snapshot, 0))      as carb,
              sum(coalesce(fat_snapshot, 0))        as fat
       from entries
       where date(logged_at, 'localtime') >= ?
       group by d`,
    )
    .all(cutoffIso) as Array<{ d: string; cal: number; prot: number; carb: number; fat: number }>;

  const byDate = new Map(rows.map((r) => [r.d, r]));
  const result: DayTotals[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(now, -i);
    const key = toLocalDateString(d);
    const r = byDate.get(key);
    result.push({
      date: key,
      calories: r?.cal ?? 0,
      protein_g: r?.prot ?? 0,
      carbs_g: r?.carb ?? 0,
      fat_g: r?.fat ?? 0,
    });
  }
  return result;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear().toString().padStart(4, "0");
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDailyTarget(): number {
  const row = getSqliteConnection()
    .prepare(`select daily_calorie_target from settings where id = 1`)
    .get() as { daily_calorie_target: number } | undefined;
  return row?.daily_calorie_target ?? 2000;
}

export function setDailyTarget(value: number): void {
  getSqliteConnection()
    .prepare(`update settings set daily_calorie_target = ? where id = 1`)
    .run(value);
}
