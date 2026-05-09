"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseQuickAdd } from "./quick-add-parse";
import { relogFromFoodId, setDailyTarget, upsertFoodAndLogEntry } from "@/lib/db/queries";

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

  upsertFoodAndLogEntry(parsed.value);
  revalidatePath("/");
  return { error: null, ok: true };
}

export async function relogFood(formData: FormData): Promise<void> {
  const foodId = formData.get("food_id");
  if (typeof foodId !== "string" || !/^[0-9a-f-]{36}$/i.test(foodId)) return;
  relogFromFoodId(foodId);
  revalidatePath("/");
  revalidatePath("/foods");
}

export async function updateDailyTarget(formData: FormData): Promise<void> {
  const raw = formData.get("daily_calorie_target");
  if (typeof raw !== "string" || !/^\d+$/.test(raw.trim())) {
    redirect("/settings?error=invalid");
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 500 || n > 10000) {
    redirect("/settings?error=invalid");
  }
  setDailyTarget(n);
  revalidatePath("/");
  redirect("/settings?ok=1");
}
