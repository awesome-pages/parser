import { beforeAll, afterEach, vi } from 'vitest';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
// afterAll(() => server.close()); // Removed to avoid issues with parallel tests
