import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

/**
 * Lint rules that keep the prototype screenshot-friendly and deterministic:
 * - UI and mock generators never read Math.random or Date.now. Use `rng()` and `now()`
 *   from the mock core, so every load builds the same world and `?freeze` stops time.
 * - UI code imports the mock world only through `@/mock`, never a file below it.
 * - Dates, times and numbers are formatted only by `@/lib/format`, so they read the same everywhere.
 */
export default tseslint.config(
  { ignores: ['dist', 'src/routeTree.gen.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // The classic hook rules only. The compiler-era rules in the plugin's recommended set
      // flag the deliberate hold-still patterns in mock/core/hooks.ts, and this app does not
      // use the React Compiler.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use rng() from the mock core so data is seeded.' },
        { object: 'Date', property: 'now', message: 'Use now() or useNow() from @/mock so ?freeze works.' },
        { property: 'toLocaleDateString', message: 'Format dates with @/lib/format.' },
        { property: 'toLocaleTimeString', message: 'Format times with @/lib/format.' },
        { property: 'toLocaleString', message: 'Format numbers and dates with @/lib/format.' },
      ],
    },
  },
  {
    // UI code reaches the mock world through its public entry only.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/mock/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/mock/*', '**/mock/*'], message: "Import from '@/mock' only." }] },
      ],
    },
  },
  {
    // The clock and the random source are the only places allowed to touch the real ones.
    files: ['src/mock/core/clock.ts', 'src/mock/core/random.ts', 'src/mock/core/async.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    files: ['vite.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
