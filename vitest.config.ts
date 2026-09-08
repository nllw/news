import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
    server: {
      // sanitize-html is CommonJS but depends on ESM-only htmlparser2; let Vite transform both
      deps: { inline: ["sanitize-html", "htmlparser2"] },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
