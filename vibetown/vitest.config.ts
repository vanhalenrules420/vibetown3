import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable global test APIs like describe, it, expect
    globals: true,
    // Environment to run tests in
    environment: 'node',
    // Include files with these extensions
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Exclude node_modules
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
