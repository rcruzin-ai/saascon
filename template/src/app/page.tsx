// Home route — replace with your actual landing UI.
// The DB health badge below is server-rendered so a fresh clone can see
// connectivity at a glance. Delete it when you have real content.
import { checkSupabaseHealth } from "@/lib/supabase/health";
import { getDb, resolveDriver } from "@/lib/db";

export const dynamic = "force-dynamic";

async function ensureSeed(): Promise<void> {
  // In SQLite local mode, seed a single row on first ever request so the
  // badge shows the rich "examples reachable · N rows" state. No-op for
  // Supabase mode — that DB is seeded by the SQL Editor at setup time.
  if (resolveDriver() !== "sqlite") return;
  const db = getDb();
  const result = await db.countRows("examples");
  if ("count" in result && result.count === 0) {
    await db.insertOne("examples", { label: "saascon local mode active" });
  }
}

export default async function Home() {
  await ensureSeed();
  const health = await checkSupabaseHealth();
  const driverLabel = health.driver === "sqlite" ? "local SQLite" : "Supabase";

  const badge =
    health.status === "connected"
      ? {
          dot: "bg-green-500",
          label: `${driverLabel} connected`,
          detail: `examples table reachable · ${health.rowCount} row${health.rowCount === 1 ? "" : "s"}`,
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
      <h1 className="text-4xl font-bold tracking-tight">saascon</h1>
      <p className="text-sm text-gray-600 max-w-md">
        Replace this page with your real UI. Filled in during /build.
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
