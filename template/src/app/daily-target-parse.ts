// Pure validation for the daily-target settings form. Sibling to
// quick-add-parse.ts so the shape is testable without going through
// React Flight + Server Action serialization.

export type ParseDailyTargetResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export function parseDailyTarget(raw: unknown): ParseDailyTargetResult {
  if (typeof raw !== "string" || !/^\d+$/.test(raw.trim())) {
    return { ok: false, error: "Target must be a whole number." };
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 500 || n > 10000) {
    return { ok: false, error: "Target must be between 500 and 10000 kcal." };
  }
  return { ok: true, value: n };
}
