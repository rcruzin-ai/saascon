// Home route — replace with your actual landing UI.
// The Supabase health badge below is server-rendered so a fresh clone can
// see DB connectivity at a glance. Delete it when you have real content.
import { checkSupabaseHealth } from "@/lib/supabase/health";

export const dynamic = "force-dynamic";

export default async function Home() {
  const health = await checkSupabaseHealth();

  const badge =
    health.status === "connected"
      ? {
          dot: "bg-green-500",
          label: "Supabase connected",
          detail: `examples table reachable · ${health.rowCount} row${health.rowCount === 1 ? "" : "s"}`,
        }
      : health.status === "schema-missing"
        ? {
            dot: "bg-yellow-500",
            label: "Supabase reachable, schema not applied",
            detail: "Apply db/migrations/ to your Supabase project.",
          }
        : {
            dot: "bg-red-500",
            label: "Supabase not configured",
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
