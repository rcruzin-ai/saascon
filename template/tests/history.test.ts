import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  importQueriesAgainstDb,
  localDateAt,
  makeFreshDb,
  plantEntry,
} from "./_helpers";

describe("history aggregation — last 7 days", () => {
  let dbPath: string;
  let cleanup: () => void;
  let queries: typeof import("@/lib/db/queries");

  beforeEach(async () => {
    ({ dbPath, cleanup } = makeFreshDb());
    queries = await importQueriesAgainstDb(dbPath);
  });

  afterEach(() => cleanup());

  it("returns exactly 7 rows on an empty DB, all zero", () => {
    const days = queries.getHistoryLastNDays(7);
    expect(days).toHaveLength(7);
    expect(days.every((d) => d.calories === 0)).toBe(true);
  });

  it("aggregates by local day and fills gaps with zeros", () => {
    plantEntry(dbPath, { name: "today-1", calories: 200, protein_g: 10, carbs_g: 20, fat_g: 5,  loggedAt: localDateAt(0, 8) });
    plantEntry(dbPath, { name: "today-2", calories: 300, protein_g: 15, carbs_g: 30, fat_g: 10, loggedAt: localDateAt(0, 13) });
    plantEntry(dbPath, { name: "two-ago", calories: 800, protein_g: 40, carbs_g: 60, fat_g: 20, loggedAt: localDateAt(2, 12) });
    plantEntry(dbPath, { name: "five-ago", calories: 1200, protein_g: 60, carbs_g: 100, fat_g: 30, loggedAt: localDateAt(5, 18) });

    const days = queries.getHistoryLastNDays(7);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.calories)).toEqual([500, 0, 800, 0, 0, 1200, 0]);
    expect(days[0].protein_g).toBe(25);
    expect(days[2].protein_g).toBe(40);
    expect(days[5].protein_g).toBe(60);
  });

  it("excludes entries older than the N-day window", () => {
    plantEntry(dbPath, { name: "today",    calories: 200, loggedAt: localDateAt(0, 12) });
    plantEntry(dbPath, { name: "8-days",   calories: 9999, loggedAt: localDateAt(8, 12) });
    plantEntry(dbPath, { name: "30-days",  calories: 9999, loggedAt: localDateAt(30, 12) });

    const days = queries.getHistoryLastNDays(7);
    const total = days.reduce((s, d) => s + d.calories, 0);
    expect(total).toBe(200);
  });

  it("orders newest-first (today is index 0)", () => {
    plantEntry(dbPath, { name: "today",  calories: 100, loggedAt: localDateAt(0, 12) });
    plantEntry(dbPath, { name: "1-ago",  calories: 200, loggedAt: localDateAt(1, 12) });

    const days = queries.getHistoryLastNDays(7);
    expect(days[0].calories).toBe(100);
    expect(days[1].calories).toBe(200);
  });

  it("treats null macros as zero in the sum", () => {
    plantEntry(dbPath, { name: "Apple",   calories: 95,  loggedAt: localDateAt(0, 12) });
    plantEntry(dbPath, { name: "Yogurt",  calories: 150, protein_g: 17, loggedAt: localDateAt(0, 14) });

    const today = queries.getHistoryLastNDays(7)[0];
    expect(today.calories).toBe(245);
    expect(today.protein_g).toBe(17);
    expect(today.carbs_g).toBe(0);
    expect(today.fat_g).toBe(0);
  });
});
