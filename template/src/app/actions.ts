"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseDailyTarget } from "./daily-target-parse";
import { parseQuickAdd } from "./quick-add-parse";
import {
  deleteEntryById,
  relogFromFoodId,
  setDailyTarget,
  upsertFoodAndLogEntry,
} from "@/lib/db/queries";

export type QuickAddState = { error: string | null; ok: boolean };

export async function createEntry(
  _prev: QuickAddState,
  formData: FormData,
): Promise<QuickAddState> {
  const parsed = parseQuickAdd({
    name: formData.get("name"),
    calories: formData.get("calories"),
    protein_g: formData.get("protein_g"),
    carbs_g: formData.get("carbs_g"),
    fat_g: formData.get("fat_g"),
  });
  if (!parsed.ok) return { error: parsed.error, ok: false };

  await upsertFoodAndLogEntry(parsed.value);
  revalidatePath("/");
  return { error: null, ok: true };
}

export async function relogFood(formData: FormData): Promise<void> {
  const foodId = formData.get("food_id");
  if (typeof foodId !== "string" || !/^[0-9a-f-]{36}$/i.test(foodId)) return;
  await relogFromFoodId(foodId);
  revalidatePath("/");
  revalidatePath("/foods");
}

export async function deleteEntry(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return;
  await deleteEntryById(id);
  revalidatePath("/");
}

export async function updateDailyTarget(formData: FormData): Promise<void> {
  const parsed = parseDailyTarget(formData.get("daily_calorie_target"));
  if (!parsed.ok) redirect("/settings?error=invalid");
  await setDailyTarget(parsed.value);
  revalidatePath("/");
  redirect("/settings?ok=1");
}
