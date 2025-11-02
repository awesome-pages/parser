export type FetchLike = (
  input: string,
  init?: RequestInit
) => Promise<Response>;

/**
 * Returns a Fetch-compatible function that works in:
 * - Node >= 18 (uses global fetch)
 * - Node < 18 (lazy-loads node-fetch)
 * - Browser (global fetch)
 */
export async function resolveFetch(): Promise<FetchLike> {
  // Browser or Node >= 18
  const g = globalThis as unknown as { fetch?: FetchLike };
  if (typeof g.fetch === 'function') {
    return g.fetch;
  }

  // Node < 18 fallback
  const mod = await import('node-fetch');
  const fetchImpl = (mod.default ?? mod) as unknown as FetchLike;
  return fetchImpl;
}
