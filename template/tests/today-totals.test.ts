import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  importQueriesAgainstDb,
  localDateAt,
  makeFreshDb,
  plantEntry,
} from "./_helpers";

describe("today totals — math + TZ boundary", () => {
  let dbPath: string;
  let cleanup: () => void;
  let queries: typeof import("@/lib/db/queries");

  beforeEach(async () => {
    ({ dbPath, cleanup } = makeFreshDb());
    queries = await importQueriesAgainstDb(dbPath);
  });

  afterEach(() => cleanup());

  it("sums calories + macros across today's entries", () => {
    plantEntry(dbPath, { name: "A", calories: 320, protein_g: 10, carbs_g: 60, fat_g: 5,  loggedAt: localDateAt(0, 8) });
    plantEntry(dbPath, { name: "B", calories: 150, protein_g: 17, carbs_g: 9,  fat_g: 4,  loggedAt: localDateAt(0, 12) });
    plantEntry(dbPath, { name: "C", calories: 480, protein_g: 32, carbs_g: 45, fat_g: 18, loggedAt: localDateAt(0, 18) });

    const totals = queries.getTodayTotals();
    expect(totals.calories).toBe(950);
    expect(totals.protein_g).toBe(59);
    expect(totals.carbs_g).toBe(114);
    expect(totals.fat_g).toBe(27);
  });

  it("returns zero on an empty DB", () => {
    expect(queries.getTodayTotals()).toEqual({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  });

  it("treats missing macros as zero in the sum", () => {
    plantEntry(dbPath, { name: "Apple", calories: 95, loggedAt: localDateAt(0, 12) });
    const totals = queries.getTodayTotals();
    expect(totals.calories).toBe(95);
    expect(totals.protein_g).toBe(0);
    expect(totals.carbs_g).toBe(0);
    expect(totals.fat_g).toBe(0);
  });

  it("excludes entries from yesterday (server-local TZ boundary)", () => {
    plantEntry(dbPath, { name: "today",    calories: 200, loggedAt: localDateAt(0, 12) });
    plantEntry(dbPath, { name: "25h-ago",  calories: 999, loggedAt: localDateAt(1, 11) });
    expect(queries.getTodayTotals().calories).toBe(200);
    expect(queries.getEntriesForToday().map((e) => e.name_snapshot)).toEqual(["today"]);
  });

  it("excludes entries from tomorrow (open-right interval)", () => {
    plantEntry(dbPath, { name: "today",    calories: 200, loggedAt: localDateAt(0, 12) });
    plantEntry(dbPath, { name: "tomorrow", calories: 300, loggedAt: localDateAt(-1, 1) });
    expect(queries.getTodayTotals().calories).toBe(200);
  });
});

describe("todayUtcRange", () => {
  it("produces a 24-hour open-right window from local midnight", async () => {
    const { dbPath, cleanup } = makeFreshDb();
    try {
      const queries = await importQueriesAgainstDb(dbPath);
      const noon = new Date();
      noon.setHours(12, 0, 0, 0);
      const r = queries.todayUtcRange(noon);
      // Both bounds are well-formed SQLite UTC strings.
      expect(r.startUtc).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(r.endUtc).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      // 24-hour separation regardless of DST quirks within a single
      // non-crossing day. Use Date parsing as the cross-check.
      const startMs = Date.parse(r.startUtc.replace(" ", "T") + "Z");
      const endMs = Date.parse(r.endUtc.replace(" ", "T") + "Z");
      expect(endMs - startMs).toBe(24 * 60 * 60 * 1000);
    } finally {
      cleanup();
    }
  });
});
