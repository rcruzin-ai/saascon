// Settings — single-knob form for the daily calorie target. Server
// component; the form posts to a server action that redirects with
// ?ok=1 on success or ?error=invalid on bad input. No 'use client'.
import Link from "next/link";
import { updateDailyTarget } from "@/app/actions";
import { getDailyTarget } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ ok?: string; error?: string }> };

export default async function SettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const current = await getDailyTarget();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-4 md:p-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <Link
          href="/"
          className="text-sm font-medium text-gray-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        >
          ← Today
        </Link>
      </header>

      <form
        action={updateDailyTarget}
        className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <label htmlFor="daily-target" className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-700">Daily calorie target</span>
          <input
            id="daily-target"
            name="daily_calorie_target"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            defaultValue={current}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base tabular-nums text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          />
          <span className="text-xs text-gray-500">Whole number between 500 and 10000.</span>
        </label>

        {params.error === "invalid" ? (
          <p role="alert" className="text-sm text-red-600">
            Target must be a whole number between 500 and 10000.
          </p>
        ) : null}
        {params.ok === "1" ? (
          <p role="status" className="text-sm text-green-700">
            Saved.
          </p>
        ) : null}

        <button
          type="submit"
          className="min-h-11 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        >
          Save
        </button>
      </form>
    </main>
  );
}
