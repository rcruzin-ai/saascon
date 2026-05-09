import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/_setup-env.ts"],
    environment: "node",
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    // Cloud-mode smoke tests cross the wide-area network (Supabase REST →
    // Postgres). Default 5s is tight; 30s leaves room for cold pooler
    // connections.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
