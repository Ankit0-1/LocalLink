import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './tests/globalSetup.ts',
    setupFiles: ['./tests/setupEach.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    teardownTimeout: 60_000,
    pool: 'forks',
    // All test files share one Postgres database (see tests/globalSetup.ts) and reset it
    // before each test (see tests/setupEach.ts), so they must run sequentially.
    fileParallelism: false,
  },
});
