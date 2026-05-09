// History — last 7 days, one row per day with totals + a CSS bar of
// calories vs the daily target. Server component. The aggregation is
// ONE SQL query (group by date(...)) — JS fills empty days.
import Link from "next/link";
import { progressPct } from "@/components/progress-bar";
import { getDailyTarget, getHistoryLastNDays, type DayTotals } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [target, days] = await Promise.all([getDailyTarget(), getHistoryLastNDays(7)]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-4 md:p-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">History</h1>
        <Link
          href="/"
          className="text-sm font-medium text-gray-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        >
          ← Today
        </Link>
      </header>

      <p className="text-sm text-gray-600">Last 7 days vs {target} kcal target.</p>

      <ul className="flex flex-col gap-2">
        {days.map((d, i) => (
          <DayRow key={d.date} day={d} target={target} highlight={i === 0} />
        ))}
      </ul>
    </main>
  );
}

function DayRow({
  day,
  target,
  highlight,
}: {
  day: DayTotals;
  target: number;
  highlight: boolean;
}) {
  const pct = progressPct(day.calories, target);
  const over = day.calories > target;
  const fill = day.calories === 0 ? "bg-gray-300" : over ? "bg-red-500" : "bg-green-500";

  return (
    <li
      className={`flex flex-col gap-2 rounded-xl border p-3 ${highlight ? "border-gray-900 bg-white" : "border-gray-200 bg-white"}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{formatDay(day.date, highlight)}</span>
          <span className="text-xs text-gray-500">
            {Math.round(day.protein_g)}P · {Math.round(day.carbs_g)}C · {Math.round(day.fat_g)}F
          </span>
        </div>
        <span className="tabular-nums text-sm font-semibold text-gray-900">
          {Math.round(day.calories)} / {target} kcal
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Calories on ${day.date}`}
        aria-valuenow={Math.round(day.calories)}
        aria-valuemin={0}
        aria-valuemax={target}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} aria-hidden />
      </div>
    </li>
  );
}

function formatDay(yyyyMmDd: string, isToday: boolean): string {
  if (isToday) return "Today";
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
