# Active todo — calorie-tracker

> v1 build complete + cloud-mode port shipped. Ready to push the preview branch.

## T-008 — Cloud-mode port (✅ done locally — pending Vercel deploy)

- [x] Migration: anon write policies (Postgres real, SQLite no-op stub)
- [x] Migration: `foods.name_lower` generated column for Supabase `.upsert(onConflict: 'name_lower')` (Postgres real, SQLite no-op stub)
- [x] `db/schema.sql` updated to reflect both
- [x] `src/lib/db/tz.ts` — `NEXT_PUBLIC_TIMEZONE`-driven boundary
- [x] `src/lib/db/queries-types.ts` — shared row + input types
- [x] `src/lib/db/queries-sqlite.ts` — moved verbatim from old `queries.ts`
- [x] `src/lib/db/queries-supabase.ts` — 9 functions implemented via `@supabase/supabase-js`
- [x] `src/lib/db/queries.ts` — `resolveDriver()`-based async router; re-exports `todayUtcRange` for the test
- [x] All consumer code updated to `await` queries calls (page, foods/page, history/page, settings/page, actions)
- [x] Local-mode: 44 vitest tests still passing
- [x] Local-mode: typecheck + lint + build green
- [x] Local-mode: `rm local.db* && npm run dev` → green badge, today view shows 950 kcal seed, history page renders
- [x] `docs/deploy-vercel.md` — step-by-step guide
- [x] SPEC.md updated to note cloud-mode dependencies
- [x] Commit `T-008: cloud-mode port — queries.ts router + Supabase impls`
- [ ] **Push `preview/calorie-tracker` branch**
- [ ] **User applies migrations in Supabase + sets Vercel env vars** (deploy-vercel.md walks through it)
- [ ] **Verify preview URL works end-to-end**

## Out-of-plan discoveries during T-008

- **OOP-T8-1 — Cloud upsert + log is two sequential calls.** Failure mode "food saved, entry not logged" is documented in `queries-supabase.ts`. To get atomicity, lift the pair into a Postgres function and call via `.rpc()`. Not blocking for v1 demo.
- **OOP-T8-2 — Cloud history bucketing is JS-side, single SELECT.** SQLite path uses `group by date(logged_at, 'localtime')` for one aggregate query. Supabase path fetches raw rows for the 7-day window and buckets in JS — still ONE round-trip, but moves work to the function. If the dataset grows to thousands of entries per week, switch to a `date_trunc` Postgres view.

## Blockers / questions

(none — ready to push)
