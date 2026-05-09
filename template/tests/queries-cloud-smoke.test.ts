// Cloud-path smoke test. Hits a real Supabase project when DATABASE_URL
// is set in the environment; skips otherwise. Single full CRUD round-trip
// against the `examples` table — proves the Supabase queries layer
// works end-to-end without paying the cost of a per-test fresh schema.
//
// Run:
//   npm test                 # local-only tests + this if DATABASE_URL set
//   DATABASE_URL=... npm test
//
// Cleans up after itself: every row created here gets deleted at the
// end, and a `beforeAll` deletes any leftover rows from earlier failed
// runs (using a known label prefix).

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LABEL_PREFIX = "smoke-test:";

const skip = !(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) || !DATABASE_URL;

(skip ? describe.skip : describe)("cloud queries — smoke (real Supabase)", () => {
  let queries: typeof import("@/lib/db/queries");
  const createdIds: string[] = [];

  beforeAll(async () => {
    process.env.SAASCON_DB_DRIVER = "supabase";
    queries = await import("@/lib/db/queries");

    // Best-effort cleanup of leftover smoke rows from previous failed runs.
    const existing = await queries.listExamples();
    for (const row of existing.filter((r) => r.label.startsWith(LABEL_PREFIX))) {
      await queries.deleteExampleById(row.id);
    }
  });

  afterAll(async () => {
    // Clean up everything we created, even if a test failed mid-way.
    for (const id of createdIds) {
      await queries.deleteExampleById(id).catch(() => {});
    }
    delete process.env.SAASCON_DB_DRIVER;
  });

  it("creates a row and reads it back", async () => {
    const label = `${LABEL_PREFIX}created-${Date.now()}`;
    const { id } = await queries.createExample({ label });
    createdIds.push(id);
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);

    const all = await queries.listExamples();
    const ours = all.find((r) => r.id === id);
    expect(ours).toBeDefined();
    expect(ours?.label).toBe(label);
    expect(typeof ours?.created_at).toBe("string");
  });

  it("deletes a row", async () => {
    const label = `${LABEL_PREFIX}delete-${Date.now()}`;
    const { id } = await queries.createExample({ label });
    createdIds.push(id);

    const before = await queries.listExamples();
    expect(before.find((r) => r.id === id)).toBeDefined();

    const result = await queries.deleteExampleById(id);
    expect(result.changes).toBe(1);

    const after = await queries.listExamples();
    expect(after.find((r) => r.id === id)).toBeUndefined();
  });

  it("returns changes=0 when deleting a non-existent id", async () => {
    const result = await queries.deleteExampleById("00000000-0000-0000-0000-000000000000");
    expect(result.changes).toBe(0);
  });
});
