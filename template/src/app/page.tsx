// Home route — calorie-tracker landing UI lands in T-002.
// For T-001 the DB health badge is the only render — proves the new schema
// is reachable on a fresh clone.
import { checkSupabaseHealth } from "@/lib/supabase/health";

export const dynamic = "force-dynamic";

export default async function Home() {
  const health = await checkSupabaseHealth();
  const driverLabel = health.driver === "sqlite" ? "local SQLite" : "Supabase";

  const badge =
    health.status === "connected"
      ? {
          dot: "bg-green-500",
          label: `${driverLabel} connected`,
          detail: `settings table reachable · ${health.rowCount} row${health.rowCount === 1 ? "" : "s"}`,
        }
      : health.status === "schema-missing"
        ? {
            dot: "bg-yellow-500",
            label: `${driverLabel} reachable, schema not applied`,
            detail:
              health.driver === "sqlite"
                ? "Restart npm run dev to re-run migrations from db/sqlite/migrations/."
                : "Apply files in db/migrations/ to your Supabase project.",
          }
        : {
            dot: "bg-red-500",
            label: `${driverLabel} not configured`,
            detail: health.reason,
          };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">calorie tracker</h1>
      <p className="text-sm text-gray-600 max-w-md">
        Today view lands in T-002. The badge below confirms the new schema is reachable.
      </p>
      <div
        className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm"
        role="status"
        aria-live="polite"
      >
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${badge.dot}`} aria-hidden />
        <span className="font-medium text-gray-900">{badge.label}</span>
      </div>
      <p className="text-xs text-gray-500 max-w-md">{badge.detail}</p>
    </main>
  );
}
