"use server";

import { revalidatePath } from "next/cache";
import { parseQuickAdd } from "./quick-add-parse";
import { upsertFoodAndLogEntry } from "@/lib/db/queries";

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
