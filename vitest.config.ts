import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/unit/setup.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
