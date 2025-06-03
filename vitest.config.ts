import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test environment
    environment: "node",

    // File patterns
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: ["node_modules", "dist"],

    // Enable this for test-coverage
    //
    // Reporter configuration
    // reporters: ["verbose", "json", "html"],

    // Coverage configuration
    // coverage: {
    //   provider: "v8",
    //   reporter: ["text", "json", "html"],
    //   include: ["src/**/*.ts"],
    //   exclude: [
    //     "src/**/*.test.ts",
    //     "src/**/*.spec.ts",
    //     "src/types/**",
    //     "src/**/*.d.ts",
    //   ],
    // },

    // Watch configuration
    watch: false,

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // // Global setup
    // globals: false,

    // // Concurrent tests
    // maxConcurrency: 4,
    // maxWorkers: 4,
  },
});
