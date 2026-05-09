// Shared row + input types. Lives outside the two backend modules so
// product code can `import type` without pulling either driver in.

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

export type FoodRow = {
  id: string;
  name: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  created_at: string;
};

export type TodayTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type DayTotals = {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type LogInput = {
  name: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};
