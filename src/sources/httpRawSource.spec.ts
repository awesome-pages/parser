import { describe, it, expect, beforeEach, vi } from 'vitest';

// System under test
import { HttpRawSource } from '@/sources/httpRawSource';
import {
  MarkdownSourceError,
  UnsupportedMimeTypeError,
} from '@/sources/errors';

// --- Test helpers ---------------------------------------------------------

type HeadersLike = { get(name: string): string | null };

function makeHeaders(map: Record<string, string | undefined>): HeadersLike {
  const norm: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    if (typeof v === 'string') norm[k.toLowerCase()] = v;
  }
  return {
    get(name: string) {
      return norm[name.toLowerCase()] ?? null;
    },
  };
}

function makeResponse(opts: {
  ok: boolean;
  status: number;
  body?: string;
  headers?: Record<string, string | undefined>;
}) {
  const body = opts.body ?? '';
  return {
    ok: opts.ok,
    status: opts.status,
    headers: makeHeaders(opts.headers ?? {}),
    text: async () => body,
  } as unknown as Response;
}

// We'll mock resolveFetch to return a per-test fetch function
let fetchImpl: (input: string, init?: RequestInit) => Promise<Response>;
vi.mock('@/sources/helpers/resolveFetch', () => {
  return {
    resolveFetch: async () => fetchImpl,
  };
});

// -------------------------------------------------------------------------

describe('HttpRawSource', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads markdown successfully when content-type is text/markdown', async () => {
    fetchImpl = async () =>
      makeResponse({
        ok: true,
        status: 200,
        body: '# Hello',
        headers: { 'content-type': 'text/markdown; charset=utf-8' },
      });

    const src = new HttpRawSource('https://example.com/readme.md');
    const text = await src.read();
    expect(text).toBe('# Hello');
  });

  it('accepts text/plain when URL ends with .md (extension fallback)', async () => {
    fetchImpl = async () =>
      makeResponse({
        ok: true,
        status: 200,
        body: 'ok',
        headers: { 'content-type': 'text/plain' },
      });

    const src = new HttpRawSource('https://example.com/README.md');
    const text = await src.read();
    expect(text).toBe('ok');
  });

  it('rejects unsupported MIME type when URL does not end with .md', async () => {
    fetchImpl = async () =>
      makeResponse({
        ok: true,
        status: 200,
        body: '<html></html>',
        headers: { 'content-type': 'text/html' },
      });

    const src = new HttpRawSource('https://example.com/readme');
    await expect(src.read()).rejects.toBeInstanceOf(UnsupportedMimeTypeError);
  });

  it('returns HTTP_STATUS error on non-OK responses (e.g., 404)', async () => {
    fetchImpl = async () =>
      makeResponse({
        ok: false,
        status: 404,
        body: 'Not Found',
        headers: { 'content-type': 'text/plain' },
      });

    const src = new HttpRawSource('https://example.com/missing.md');
    await expect(src.read()).rejects.toMatchObject({ code: 'HTTP_STATUS' });
  });

  it('wraps network errors as HTTP_FETCH', async () => {
    fetchImpl = async () => {
      throw new Error('socket hang up');
    };
    const src = new HttpRawSource('https://example.com/readme.md');
    await expect(src.read()).rejects.toMatchObject({ code: 'HTTP_FETCH' });
  });

  it('aborts on large Content-Length before download', async () => {
    fetchImpl = async () =>
      makeResponse({
        ok: true,
        status: 200,
        body: 'x'.repeat(10),
        headers: {
          'content-type': 'text/markdown',
          'content-length': String(3 * 1024 * 1024),
        },
      });

    const src = new HttpRawSource('https://example.com/README.md', {
      maxBytes: 1024,
    });
    await expect(src.read()).rejects.toMatchObject({ code: 'HTTP_MAX_SIZE' });
  });

  it('checks size after download when Content-Length is missing', async () => {
    fetchImpl = async () =>
      makeResponse({
        ok: true,
        status: 200,
        body: 'x'.repeat(2048),
        headers: { 'content-type': 'text/markdown' },
      });

    const src = new HttpRawSource('https://example.com/README.md', {
      maxBytes: 1024,
    });
    await expect(src.read()).rejects.toMatchObject({ code: 'HTTP_MAX_SIZE' });
  });
});
