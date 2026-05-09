// Product-level queries router. Picks the SQLite or Supabase backend
// at runtime based on resolveDriver() (see ./index.ts). Both backends
// share the row + input types in ./queries-types.
//
// Every function is exported as async so callers don't need to know
// which path is active. Local mode's sync functions just resolve
// immediately.

import { resolveDriver } from "./index";
import * as sqliteImpl from "./queries-sqlite";
import * as supabaseImpl from "./queries-supabase";

export type {
  EntryRow,
  FoodRow,
  TodayTotals,
  DayTotals,
  LogInput,
} from "./queries-types";

function isCloud(): boolean {
  return resolveDriver() === "supabase";
}

export async function getEntriesForToday(now?: Date) {
  return isCloud() ? supabaseImpl.getEntriesForToday(now) : sqliteImpl.getEntriesForToday(now);
}

export async function getTodayTotals(now?: Date) {
  return isCloud() ? supabaseImpl.getTodayTotals(now) : sqliteImpl.getTodayTotals(now);
}

export async function upsertFoodAndLogEntry(input: import("./queries-types").LogInput) {
  return isCloud() ? supabaseImpl.upsertFoodAndLogEntry(input) : sqliteImpl.upsertFoodAndLogEntry(input);
}

export async function listFoods() {
  return isCloud() ? supabaseImpl.listFoods() : sqliteImpl.listFoods();
}

export async function relogFromFoodId(foodId: string) {
  return isCloud() ? supabaseImpl.relogFromFoodId(foodId) : sqliteImpl.relogFromFoodId(foodId);
}

export async function getHistoryLastNDays(days: number, now?: Date) {
  return isCloud()
    ? supabaseImpl.getHistoryLastNDays(days, now)
    : sqliteImpl.getHistoryLastNDays(days, now);
}

export async function getDailyTarget() {
  return isCloud() ? supabaseImpl.getDailyTarget() : sqliteImpl.getDailyTarget();
}

export async function setDailyTarget(value: number) {
  return isCloud() ? supabaseImpl.setDailyTarget(value) : sqliteImpl.setDailyTarget(value);
}

export async function deleteEntryById(id: string) {
  return isCloud() ? supabaseImpl.deleteEntryById(id) : sqliteImpl.deleteEntryById(id);
}

// Re-exported sync helper for the SQLite path's tests + the today-view's
// existing usage. Cloud-mode tests don't import this.
export { todayUtcRange } from "./queries-sqlite";
