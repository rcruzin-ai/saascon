// Pure validation for the quick-add form. Lives outside actions.ts so it
// can be exercised directly by a parity test without going through React
// Flight + Server Action serialization.
//
// Numbers: calories is integer 0–10000. Macros are decimal 0–1000 and
// optional (empty string → null). Inputs come from FormData; values may
// be string or File — coerce to string then parse.

export type ParsedQuickAdd = {
  name: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

export type ParseResult =
  | { ok: true; value: ParsedQuickAdd }
  | { ok: false; error: string };

export function parseQuickAdd(input: {
  name: unknown;
  calories: unknown;
  protein_g: unknown;
  carbs_g: unknown;
  fat_g: unknown;
}): ParseResult {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 1) return { ok: false, error: "Name is required." };
  if (name.length > 80) return { ok: false, error: "Name must be 80 characters or fewer." };

  const calories = parseInteger(input.calories);
  if (calories === null) return { ok: false, error: "Calories must be a whole number." };
  if (calories < 0 || calories > 10000)
    return { ok: false, error: "Calories must be between 0 and 10000." };

  const protein_g = parseOptionalDecimal(input.protein_g);
  if (protein_g === "invalid") return { ok: false, error: "Protein must be a number." };
  if (protein_g !== null && (protein_g < 0 || protein_g > 1000))
    return { ok: false, error: "Protein must be between 0 and 1000 g." };

  const carbs_g = parseOptionalDecimal(input.carbs_g);
  if (carbs_g === "invalid") return { ok: false, error: "Carbs must be a number." };
  if (carbs_g !== null && (carbs_g < 0 || carbs_g > 1000))
    return { ok: false, error: "Carbs must be between 0 and 1000 g." };

  const fat_g = parseOptionalDecimal(input.fat_g);
  if (fat_g === "invalid") return { ok: false, error: "Fat must be a number." };
  if (fat_g !== null && (fat_g < 0 || fat_g > 1000))
    return { ok: false, error: "Fat must be between 0 and 1000 g." };

  return { ok: true, value: { name, calories, protein_g, carbs_g, fat_g } };
}

function parseInteger(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (t === "" || !/^-?\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// "" → null (optional field omitted). Non-numeric → "invalid". Otherwise
// the parsed number.
function parseOptionalDecimal(v: unknown): number | null | "invalid" {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (t === "") return null;
  if (!/^-?\d+(\.\d+)?$/.test(t)) return "invalid";
  const n = Number(t);
  return Number.isFinite(n) ? n : "invalid";
}
