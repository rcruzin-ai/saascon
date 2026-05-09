// Foods library — every food the user has logged at least once. Each row
// has a one-tap re-log button that snapshots the food's current catalog
// values onto a new entry. Server component; the button lives in a plain
// <form action={serverAction}> so there's no client JS on this page.
import Link from "next/link";
import { relogFood } from "@/app/actions";
import { listFoods, type FoodRow } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default function FoodsPage() {
  const foods = listFoods();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-4 md:p-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Foods</h1>
        <Link
          href="/"
          className="text-sm font-medium text-gray-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        >
          ← Today
        </Link>
      </header>

      {foods.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
          No foods yet. Log one on the today view and it&apos;ll show up here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {foods.map((f) => (
            <FoodItem key={f.id} food={f} />
          ))}
        </ul>
      )}
    </main>
  );
}

function FoodItem({ food }: { food: FoodRow }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{food.name}</span>
        <span className="text-xs text-gray-500">
          <span className="tabular-nums">{food.calories} kcal</span>
          {macroSuffix(food)}
        </span>
      </div>
      <form action={relogFood}>
        <input type="hidden" name="food_id" value={food.id} />
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-gray-900 px-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          aria-label={`Log ${food.name} again`}
        >
          Log again
        </button>
      </form>
    </li>
  );
}

function macroSuffix(f: FoodRow): string {
  const parts: string[] = [];
  if (f.protein_g != null) parts.push(`${Math.round(f.protein_g)}P`);
  if (f.carbs_g != null) parts.push(`${Math.round(f.carbs_g)}C`);
  if (f.fat_g != null) parts.push(`${Math.round(f.fat_g)}F`);
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}
