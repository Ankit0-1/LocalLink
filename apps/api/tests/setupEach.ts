import { beforeEach } from 'vitest';
import { resetDatabase } from './helpers.js';

beforeEach(async () => {
  await resetDatabase();
});
