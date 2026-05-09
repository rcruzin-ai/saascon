// Server component. Calorie progress against a daily target. Color shifts
// past 100% (over-target stays accessible — the number is the source of
// truth, color is supporting signal).
type Props = {
  value: number;
  target: number;
  label: string;
};

// Exported for unit tests.
export function progressPct(value: number, target: number): number {
  const safeTarget = Math.max(target, 1);
  return Math.min(100, Math.round((value / safeTarget) * 100));
}

export function ProgressBar({ value, target, label }: Props) {
  const pct = progressPct(value, target);
  const over = value > target;
  const fill = over ? "bg-red-500" : "bg-green-500";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-gray-900">{label}</span>
        <span className="tabular-nums text-gray-700">
          {Math.round(value)} / {target} kcal
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={target}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className={`h-full ${fill} transition-[width]`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
