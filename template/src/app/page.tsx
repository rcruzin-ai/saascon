// Today view — the calorie-tracker home. Server-rendered: seed + read +
// totals + progress bar + entries list. Quick-add form lands in T-003.
import Link from "next/link";
import { deleteEntry } from "@/app/actions";
import { ProgressBar } from "@/components/progress-bar";
import { QuickAddForm } from "@/components/quick-add-form";
import { checkSupabaseHealth } from "@/lib/supabase/health";
import { getDailyTarget, getEntriesForToday, getTodayTotals, type EntryRow } from "@/lib/db/queries";
import { seedDev } from "@/lib/db/seed-dev";
import { resolveDriver } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (resolveDriver() === "sqlite") seedDev();

  const [target, totals, entries, health] = await Promise.all([
    getDailyTarget(),
    getTodayTotals(),
    getEntriesForToday(),
    checkSupabaseHealth(),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-4 md:p-6">
      <header className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Today</h1>
          <p className="text-sm text-gray-600">{formatTodayHeading()}</p>
        </div>
        <nav className="flex flex-col items-end gap-1 text-sm">
          <Link
            href="/foods"
            className="font-medium text-gray-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          >
            Foods →
          </Link>
          <Link
            href="/history"
            className="font-medium text-gray-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          >
            History →
          </Link>
          <Link
            href="/settings"
            className="font-medium text-gray-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          >
            Settings →
          </Link>
        </nav>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <ProgressBar value={totals.calories} target={target} label="Calories" />
        <MacroRow totals={totals} />
      </section>

      <QuickAddForm />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Logged today
        </h2>
        {entries.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
            Nothing logged yet today.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((e) => (
              <EntryItem key={e.id} entry={e} />
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-auto pt-4 text-xs text-gray-500">
        <HealthBadge health={health} />
      </footer>
    </main>
  );
}

function MacroRow({ totals }: { totals: { protein_g: number; carbs_g: number; fat_g: number } }) {
  const cells: Array<{ label: string; value: number }> = [
    { label: "Protein", value: totals.protein_g },
    { label: "Carbs", value: totals.carbs_g },
    { label: "Fat", value: totals.fat_g },
  ];
  return (
    <dl className="grid grid-cols-3 gap-2 text-sm">
      {cells.map((c) => (
        <div key={c.label} className="flex flex-col rounded-xl bg-gray-50 p-2">
          <dt className="text-xs uppercase tracking-wide text-gray-500">{c.label}</dt>
          <dd className="tabular-nums text-base font-medium text-gray-900">
            {Math.round(c.value)} g
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EntryItem({ entry }: { entry: EntryRow }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-gray-900">{entry.name_snapshot}</span>
        <span className="text-xs text-gray-500">
          <span className="tabular-nums">{formatLocalTime(entry.logged_at)}</span>
          {macroLine(entry) ? ` · ${macroLine(entry)}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="tabular-nums text-sm font-semibold text-gray-900">
          {entry.calories_snapshot} kcal
        </span>
        <form action={deleteEntry}>
          <input type="hidden" name="id" value={entry.id} />
          <button
            type="submit"
            aria-label={`Delete ${entry.name_snapshot}`}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          >
            <span aria-hidden className="text-lg leading-none">×</span>
          </button>
        </form>
      </div>
    </li>
  );
}

function macroLine(e: EntryRow): string {
  const parts: string[] = [];
  if (e.protein_snapshot != null) parts.push(`${Math.round(e.protein_snapshot)}P`);
  if (e.carbs_snapshot != null) parts.push(`${Math.round(e.carbs_snapshot)}C`);
  if (e.fat_snapshot != null) parts.push(`${Math.round(e.fat_snapshot)}F`);
  return parts.join(" · ");
}

function formatLocalTime(sqliteUtc: string): string {
  const iso = sqliteUtc.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatTodayHeading(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function HealthBadge({
  health,
}: {
  health: Awaited<ReturnType<typeof checkSupabaseHealth>>;
}) {
  const driverLabel = health.driver === "sqlite" ? "local SQLite" : "Supabase";
  const dot =
    health.status === "connected"
      ? "bg-green-500"
      : health.status === "schema-missing"
        ? "bg-yellow-500"
        : "bg-red-500";
  const label =
    health.status === "connected"
      ? `${driverLabel} connected · settings reachable · ${health.rowCount} row${health.rowCount === 1 ? "" : "s"}`
      : health.status === "schema-missing"
        ? `${driverLabel} reachable, schema not applied`
        : `${driverLabel} not configured`;

  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <span className={`inline-block h-2 w-2 rounded-full ${dot}`} aria-hidden />
      <span>{label}</span>
    </div>
  );
}
