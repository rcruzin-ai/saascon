import { describe, expect, it } from "vitest";
import { parseDailyTarget } from "@/app/daily-target-parse";

describe("parseDailyTarget", () => {
  it.each([
    ["happy 2000",  "2000",  2000],
    ["min 500",     "500",   500],
    ["max 10000",   "10000", 10000],
  ])("accepts %s", (_label, raw, expected) => {
    const r = parseDailyTarget(raw);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(expected);
  });

  it.each([
    ["below min 499",   "499"],
    ["zero",            "0"],
    ["above max 10001", "10001"],
    ["letters",         "abc"],
    ["empty",           ""],
    ["decimal",         "2000.5"],
    ["negative",        "-100"],
    ["whitespace only", "   "],
  ])("rejects %s", (_label, raw) => {
    const r = parseDailyTarget(raw);
    expect(r.ok).toBe(false);
  });

  it("rejects non-string inputs", () => {
    expect(parseDailyTarget(null).ok).toBe(false);
    expect(parseDailyTarget(undefined).ok).toBe(false);
    expect(parseDailyTarget(2000).ok).toBe(false);
  });

  it("returns the right error for non-numeric input", () => {
    const r = parseDailyTarget("abc");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/whole number/);
  });

  it("returns the right error for out-of-range input", () => {
    const r = parseDailyTarget("100");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/between 500 and 10000/);
  });
});
