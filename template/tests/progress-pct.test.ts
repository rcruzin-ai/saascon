import { describe, expect, it } from "vitest";
import { progressPct } from "@/components/progress-bar";

describe("progressPct", () => {
  it("returns 0 when no calories logged", () => {
    expect(progressPct(0, 2000)).toBe(0);
  });

  it("scales linearly within the target", () => {
    expect(progressPct(500, 2000)).toBe(25);
    expect(progressPct(1000, 2000)).toBe(50);
    expect(progressPct(1500, 2000)).toBe(75);
  });

  it("hits 100 exactly at target", () => {
    expect(progressPct(2000, 2000)).toBe(100);
  });

  it("clamps over-target to 100", () => {
    expect(progressPct(2500, 2000)).toBe(100);
    expect(progressPct(99999, 2000)).toBe(100);
  });

  it("rounds to the nearest integer", () => {
    expect(progressPct(333, 1000)).toBe(33);
    expect(progressPct(335, 1000)).toBe(34);
  });

  it("survives a target of 0 without dividing by zero", () => {
    expect(progressPct(100, 0)).toBe(100);
    expect(progressPct(0, 0)).toBe(0);
  });
});
