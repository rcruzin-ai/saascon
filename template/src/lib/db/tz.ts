// Single source of truth for the user's timezone in cloud mode. Local
// mode does not call this — it uses server-local TZ via new Date()
// arithmetic, which is correct for the single-user-on-their-own-machine
// assumption.
//
// In cloud mode the server (Vercel function) is in some random TZ that
// has nothing to do with the user. Set NEXT_PUBLIC_TIMEZONE on the
// Vercel preview-environment to your IANA zone (e.g. "Asia/Manila").
// Defaults to "UTC" when unset — better than crashing, but the today-
// boundary will roll at UTC midnight rather than your wall-clock
// midnight unless the env var is set.

export function getUserTz(): string {
  return process.env.NEXT_PUBLIC_TIMEZONE ?? "UTC";
}

// Returns YYYY-MM-DD for the given Date in the user's timezone.
export function toUserDateString(d: Date, tz: string = getUserTz()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}

// [start, end) ISO timestamps (UTC) covering the local day containing `now`.
export function userTodayUtcRange(
  now: Date = new Date(),
  tz: string = getUserTz(),
): { startUtc: string; endUtc: string } {
  // Build a Date for "midnight today in tz" by formatting the date parts
  // in tz, then creating a UTC Date for that local midnight via offset
  // calculation.
  const todayKey = toUserDateString(now, tz);
  const start = zonedDateToUtc(`${todayKey}T00:00:00`, tz);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc: start.toISOString(), endUtc: end.toISOString() };
}

// Take a wall-clock datetime string interpreted in `tz` and return the
// corresponding UTC Date. Uses the standard Intl trick: format the UTC
// epoch in `tz`, compute the offset, apply.
function zonedDateToUtc(localIso: string, tz: string): Date {
  const provisional = new Date(localIso + "Z"); // pretend it's UTC
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = fmt.formatToParts(provisional);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  const offsetMs = asUtc - provisional.getTime();
  return new Date(provisional.getTime() - offsetMs);
}
