import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: [
      'dist/**',
      'templates/**',
      'coverage/**',
      'reports/**',
      'html/**',
      '.stryker-tmp/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  tseslint.configs.recommended,
  {
    plugins: { sonarjs },
    rules: {
      // Complexity limits from DISCIPLINE.md. Both ratchet downward, never up.
      complexity: ['error', { max: 10, variant: 'modified' }],
      'sonarjs/cognitive-complexity': ['error', 10],
    },
  },
]);
