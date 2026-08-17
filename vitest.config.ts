import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // File patterns
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],

    // Coverage is measured on the Core only. The Shell is tested where
    // applicable, but carries no coverage gate — see DISCIPLINE.md, Core and Shell.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/core/**/*.ts'],
      exclude: ['src/core/**/*.{test,spec}.ts', 'src/core/**/*.d.ts'],
      thresholds: {
        statements: 100,
        functions: 100,
        lines: 100,
        branches: 97,
      },
    },

    // Watch configuration
    watch: false,

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
