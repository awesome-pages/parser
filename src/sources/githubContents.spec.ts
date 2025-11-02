import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GitHubContentsApiSource } from '@/sources/githubContents';
import {
  RawFetchError,
  PrivateRepoError,
  NotFoundError,
  GitHubApiError,
} from '@/sources/errors';

// Mock resolveGithubToken to avoid calling gh CLI
vi.mock('@/sources/resolveGithubToken', () => ({
  resolveGithubToken: vi.fn(async () => undefined),
}));

// Minimal Response-like factory for our FetchLike
function makeResponse(opts: {
  ok: boolean;
  status: number;
  body?: string;
  json?: unknown;
}) {
  return {
    ok: opts.ok,
    status: opts.status,
    text: async () => opts.body ?? '',
    json: async () => opts.json ?? {},
  } as const;
}

function b64(s: string) {
  return Buffer.from(s, 'utf8').toString('base64');
}

// Queue-based fetch mock so we can control sequential calls (RAW then API)
function installFetchQueue(
  queue: ReadonlyArray<ReturnType<typeof makeResponse>>
) {
  const q = [...queue];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fn = vi.fn(async (url: string) => {
    const next = q.shift();
    if (!next) throw new Error('No more mocked responses in queue');
    return next as unknown as ReturnType<typeof makeResponse>;
  });
  (globalThis as unknown as { fetch: typeof fn }).fetch = fn;
  return fn;
}

describe('GitHubContentsApiSource', () => {
  const owner = 'foo';
  const repo = 'bar';
  const ref = 'main';
  const path = 'README.md';

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // ensure global fetch is cleared to exercise raw-first logic deterministically
    delete (globalThis as unknown as { fetch?: unknown }).fetch;
  });

  it('returns RAW content when public and no token (raw-first)', async () => {
    // RAW 200 → return text; API should not be called
    const fetchMock = installFetchQueue([
      makeResponse({ ok: true, status: 200, body: '# Public README' }),
    ]);

    const src = new GitHubContentsApiSource(
      owner,
      repo,
      ref,
      path /* no token */
    );
    const md = await src.read();

    expect(md).toBe('# Public README');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(
      /raw\.githubusercontent\.com\/foo\/bar\/main\/README\.md/
    );
  });

  it('falls back to Contents API after RAW 404 and decodes base64 body', async () => {
    // RAW 404 → API 200 {content: base64, encoding: 'base64'}
    const fetchMock = installFetchQueue([
      makeResponse({ ok: false, status: 404, body: 'Not found' }),
      makeResponse({
        ok: true,
        status: 200,
        json: { content: b64('Hello'), encoding: 'base64' },
      }),
    ]);

    const src = new GitHubContentsApiSource(owner, repo, ref, path);
    const md = await src.read();

    expect(md).toBe('Hello');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toMatch(/raw\.githubusercontent/);
    expect(fetchMock.mock.calls[1][0]).toMatch(/api\.github\.com\/repos/);
  });

  it('throws RawFetchError when RAW fails with 5xx', async () => {
    installFetchQueue([
      makeResponse({ ok: false, status: 500, body: 'server oops' }),
    ]);

    const src = new GitHubContentsApiSource(owner, repo, ref, path);
    await expect(src.read()).rejects.toBeInstanceOf(RawFetchError);
  });

  it('throws PrivateRepoError when RAW 403 and API 403 (no token)', async () => {
    // RAW 403 → API 403 → prefer typed RAW hint (PrivateRepoError)
    installFetchQueue([
      makeResponse({ ok: false, status: 403, body: 'forbidden' }),
      makeResponse({ ok: false, status: 403, body: 'forbidden api' }),
    ]);

    const src = new GitHubContentsApiSource(owner, repo, ref, path);
    await expect(src.read()).rejects.toBeInstanceOf(PrivateRepoError);
  });

  it('throws NotFoundError when RAW 404 and API 404 (no token)', async () => {
    // RAW 404 → API 404 → prefer typed RAW hint (NotFoundError)
    installFetchQueue([
      makeResponse({ ok: false, status: 404, body: 'raw 404' }),
      makeResponse({ ok: false, status: 404, body: 'api 404' }),
    ]);

    const src = new GitHubContentsApiSource(owner, repo, ref, path);
    await expect(src.read()).rejects.toBeInstanceOf(NotFoundError);
  });

  it('uses Contents API directly when token is provided and decodes base64', async () => {
    // With token, RAW is skipped → API 200
    const fetchMock = installFetchQueue([
      makeResponse({
        ok: true,
        status: 200,
        json: { content: b64('With token'), encoding: 'base64' },
      }),
    ]);

    const src = new GitHubContentsApiSource(owner, repo, ref, path, 'ghp_TEST');
    const md = await src.read();

    expect(md).toBe('With token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/api\.github\.com\/repos/);
  });

  it('throws GitHubApiError when API fails and no RAW hint was present (token case)', async () => {
    const fetchMock = installFetchQueue([
      makeResponse({ ok: false, status: 500, body: 'api down' }),
    ]);

    const src = new GitHubContentsApiSource(owner, repo, ref, path, 'ghp_TEST');
    await expect(src.read()).rejects.toBeInstanceOf(GitHubApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
