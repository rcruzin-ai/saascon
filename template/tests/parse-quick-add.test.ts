import { describe, expect, it } from "vitest";
import { parseQuickAdd } from "@/app/quick-add-parse";

describe("parseQuickAdd", () => {
  it("accepts the happy path", () => {
    const r = parseQuickAdd({
      name: "Oatmeal",
      calories: "320",
      protein_g: "10",
      carbs_g: "60",
      fat_g: "5",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual({ name: "Oatmeal", calories: 320, protein_g: 10, carbs_g: 60, fat_g: 5 });
    }
  });

  it("trims surrounding whitespace from name", () => {
    const r = parseQuickAdd({ name: "  Eggs  ", calories: "70", protein_g: "", carbs_g: "", fat_g: "" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.name).toBe("Eggs");
  });

  it("rejects empty / whitespace-only name", () => {
    for (const name of ["", "   "]) {
      const r = parseQuickAdd({ name, calories: "100", protein_g: "", carbs_g: "", fat_g: "" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/Name is required/);
    }
  });

  it("rejects names longer than 80 chars", () => {
    const r = parseQuickAdd({
      name: "x".repeat(81),
      calories: "100",
      protein_g: "",
      carbs_g: "",
      fat_g: "",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/80/);
  });

  it.each([
    ["empty",     ""],
    ["letters",   "abc"],
    ["decimal",   "12.5"],
  ])("rejects calories that are not whole numbers (%s)", (_label, raw) => {
    const r = parseQuickAdd({ name: "Apple", calories: raw, protein_g: "", carbs_g: "", fat_g: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/whole number/);
  });

  it.each([
    ["negative", "-1"],
    ["over max", "50000"],
  ])("rejects calories outside 0–10000 (%s)", (_label, raw) => {
    const r = parseQuickAdd({ name: "Apple", calories: raw, protein_g: "", carbs_g: "", fat_g: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/between 0 and 10000/);
  });

  it("treats macros as optional (empty → null)", () => {
    const r = parseQuickAdd({ name: "Water", calories: "0", protein_g: "", carbs_g: "", fat_g: "" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.protein_g).toBeNull();
      expect(r.value.carbs_g).toBeNull();
      expect(r.value.fat_g).toBeNull();
    }
  });

  it("accepts decimal macros", () => {
    const r = parseQuickAdd({
      name: "Avocado",
      calories: "240",
      protein_g: "3",
      carbs_g: "12.5",
      fat_g: "22.1",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.protein_g).toBe(3);
      expect(r.value.carbs_g).toBe(12.5);
      expect(r.value.fat_g).toBe(22.1);
    }
  });

  it("rejects non-numeric macros", () => {
    const r = parseQuickAdd({
      name: "Avocado",
      calories: "240",
      protein_g: "abc",
      carbs_g: "",
      fat_g: "",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Protein must be a number/);
  });

  it("rejects macros over 1000g", () => {
    const r = parseQuickAdd({
      name: "Avocado",
      calories: "240",
      protein_g: "1500",
      carbs_g: "",
      fat_g: "",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/between 0 and 1000/);
  });
});
