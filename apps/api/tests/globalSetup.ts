import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer | undefined;

// Runs once, before any test file, in the main Vitest process. Environment variables set
// here are inherited by the forked worker process (see `pool: 'forks'` in vitest.config.ts),
// so every test file sees the same throwaway, migrated database via DATABASE_URL.
export async function setup() {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const databaseUrl = container.getConnectionUri();

  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET = 'vitest-test-secret-at-least-32-characters-long';

  const apiRoot = fileURLToPath(new URL('..', import.meta.url));
  execSync('npx prisma migrate deploy', {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}

export async function teardown() {
  await container?.stop();
}
