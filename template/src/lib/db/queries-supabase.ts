// Supabase implementations of the product queries. Used in cloud mode.
//
// Atomicity differences vs. SQLite:
//   - upsertFoodAndLogEntry runs as TWO sequential calls (.upsert food
//     then .insert entry). Failure mode: food saved, entry not. User retries.
//   - relogFromFoodId runs as TWO calls (lookup → insert). Same caveat.
//
// These are acceptable for a single-user demo. If they bite, lift them
// into a Postgres function and call it via .rpc().

import { getServerSupabase } from "../supabase/server";
import { getUserTz, toUserDateString, userTodayUtcRange } from "./tz";
import type {
  DayTotals,
  EntryRow,
  FoodRow,
  LogInput,
  TodayTotals,
} from "./queries-types";

export async function getEntriesForToday(now: Date = new Date()): Promise<EntryRow[]> {
  const supabase = getServerSupabase();
  const { startUtc, endUtc } = userTodayUtcRange(now);
  const { data, error } = await supabase
    .from("entries")
    .select(
      "id, food_id, name_snapshot, calories_snapshot, protein_snapshot, carbs_snapshot, fat_snapshot, logged_at",
    )
    .gte("logged_at", startUtc)
    .lt("logged_at", endUtc)
    .order("logged_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as EntryRow[];
}

export async function getTodayTotals(now: Date = new Date()): Promise<TodayTotals> {
  const supabase = getServerSupabase();
  const { startUtc, endUtc } = userTodayUtcRange(now);
  const { data, error } = await supabase
    .from("entries")
    .select("calories_snapshot, protein_snapshot, carbs_snapshot, fat_snapshot")
    .gte("logged_at", startUtc)
    .lt("logged_at", endUtc);
  if (error) throw new Error(error.message);
  const totals: TodayTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  for (const r of data ?? []) {
    totals.calories += r.calories_snapshot ?? 0;
    totals.protein_g += r.protein_snapshot ?? 0;
    totals.carbs_g += r.carbs_snapshot ?? 0;
    totals.fat_g += r.fat_snapshot ?? 0;
  }
  return totals;
}

export async function upsertFoodAndLogEntry(
  input: LogInput,
): Promise<{ foodId: string; entryId: string }> {
  const supabase = getServerSupabase();

  const { data: food, error: foodErr } = await supabase
    .from("foods")
    .upsert(
      {
        name: input.name,
        calories: input.calories,
        protein_g: input.protein_g,
        carbs_g: input.carbs_g,
        fat_g: input.fat_g,
      },
      { onConflict: "name_lower" },
    )
    .select("id")
    .single();
  if (foodErr) throw new Error(foodErr.message);

  const { data: entry, error: entryErr } = await supabase
    .from("entries")
    .insert({
      food_id: food.id,
      name_snapshot: input.name,
      calories_snapshot: input.calories,
      protein_snapshot: input.protein_g,
      carbs_snapshot: input.carbs_g,
      fat_snapshot: input.fat_g,
    })
    .select("id")
    .single();
  if (entryErr) throw new Error(entryErr.message);

  return { foodId: food.id, entryId: entry.id };
}

export async function listFoods(): Promise<FoodRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("foods")
    .select("id, name, calories, protein_g, carbs_g, fat_g, created_at")
    .order("created_at", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as FoodRow[];
}

export async function relogFromFoodId(foodId: string): Promise<{ entryId: string } | null> {
  const supabase = getServerSupabase();
  const { data: food, error: lookupErr } = await supabase
    .from("foods")
    .select("id, name, calories, protein_g, carbs_g, fat_g")
    .eq("id", foodId)
    .maybeSingle();
  if (lookupErr) throw new Error(lookupErr.message);
  if (!food) return null;

  const { data: entry, error: insertErr } = await supabase
    .from("entries")
    .insert({
      food_id: food.id,
      name_snapshot: food.name,
      calories_snapshot: food.calories,
      protein_snapshot: food.protein_g,
      carbs_snapshot: food.carbs_g,
      fat_snapshot: food.fat_g,
    })
    .select("id")
    .single();
  if (insertErr) throw new Error(insertErr.message);
  return { entryId: entry.id };
}

export async function getHistoryLastNDays(days: number, now: Date = new Date()): Promise<DayTotals[]> {
  const supabase = getServerSupabase();
  const tz = getUserTz();

  // Compute the cutoff = start of (today - (days-1)) in user TZ, as UTC ISO.
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - (days - 1));
  const cutoffKey = toUserDateString(cutoff, tz);
  const cutoffStart = userTodayUtcRange(cutoff, tz).startUtc;

  // ONE round-trip — bucket in JS using the user TZ. Equivalent to the
  // SQLite `group by date(logged_at, 'localtime')` shape.
  const { data, error } = await supabase
    .from("entries")
    .select("logged_at, calories_snapshot, protein_snapshot, carbs_snapshot, fat_snapshot")
    .gte("logged_at", cutoffStart);
  if (error) throw new Error(error.message);

  const byDate = new Map<string, DayTotals>();
  for (const r of data ?? []) {
    const key = toUserDateString(new Date(r.logged_at), tz);
    const cur =
      byDate.get(key) ?? { date: key, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    cur.calories += r.calories_snapshot ?? 0;
    cur.protein_g += r.protein_snapshot ?? 0;
    cur.carbs_g += r.carbs_snapshot ?? 0;
    cur.fat_g += r.fat_snapshot ?? 0;
    byDate.set(key, cur);
  }

  const result: DayTotals[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = toUserDateString(d, tz);
    result.push(byDate.get(key) ?? { date: key, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  }
  // Drop the unused cutoffKey reference — kept above only as a sanity
  // check during development.
  void cutoffKey;
  return result;
}

export async function getDailyTarget(): Promise<number> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("daily_calorie_target")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.daily_calorie_target ?? 2000;
}

export async function setDailyTarget(value: number): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("settings")
    .update({ daily_calorie_target: value })
    .eq("id", 1);
  if (error) throw new Error(error.message);
}

export async function deleteEntryById(id: string): Promise<{ changes: number }> {
  const supabase = getServerSupabase();
  const { error, count } = await supabase
    .from("entries")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { changes: count ?? 0 };
}
