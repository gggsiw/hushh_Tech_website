import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Exclude integration/smoke tests that require live Supabase edge functions
    exclude: [
      'tests/ndaNotification.test.ts',
      'tests/ndaIntegration.test.ts',
      'node_modules/**',
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    testTimeout: 10000,
  },
});
