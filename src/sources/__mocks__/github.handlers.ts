import { http, HttpResponse } from 'msw';
import { Buffer } from 'node:buffer';

/**
 * Baseline GitHub handlers used in tests.
 *
 * Goals:
 * - Provide sensible defaults for RAW (public) and Contents API (tokened) flows.
 * - Keep behavior predictable while allowing per-test overrides with `server.use(...)`.
 * - Use path params where it helps, but keep the known happy-path explicit so specs remain stable.
 */

const KNOWN = {
  owner: 'teles',
  repo: 'awesome-click-and-use',
  ref: 'main',
  path: 'README.md',
};

function ghContents(md: string) {
  return {
    content: Buffer.from(md, 'utf8').toString('base64'),
    encoding: 'base64' as const,
  };
}

export const handlers = [
  /** RAW no‑token happy path (public repo) */
  http.get(
    `https://raw.githubusercontent.com/${KNOWN.owner}/${KNOWN.repo}/${KNOWN.ref}/${KNOWN.path}`,
    () =>
      HttpResponse.text('# Awesome Click and Use', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
  ),

  /** Contents API: require auth; succeed for the known tuple (owner/repo/ref/path) */
  http.get(
    `https://api.github.com/repos/${KNOWN.owner}/${KNOWN.repo}/contents/${KNOWN.path}`,
    ({ request }) => {
      const url = new URL(request.url);
      const ref = url.searchParams.get('ref');
      const auth = request.headers.get('authorization');

      if (!auth) return HttpResponse.text('Requires auth', { status: 403 });
      if (ref !== KNOWN.ref)
        return HttpResponse.text('Not Found', { status: 404 });

      return HttpResponse.json(ghContents('# Awesome (via API)'), {
        status: 200,
      });
    }
  ),

  /** Generic fallback: unexpected shape example kept for a different repo used in some tests */
  http.get('https://api.github.com/repos/foo/bar/contents/README.md', () =>
    HttpResponse.json({ unexpected: true }, { status: 200 })
  ),

  /**
   * Optional protective generic routes (lowest priority):
   * Keep them returning 404 so tests can override precisely with server.use(...).
   * They avoid accidental matches going silently OK.
   */
  http.get('https://raw.githubusercontent.com/:owner/:repo/:ref/:path*', () =>
    HttpResponse.text('Not Found (generic RAW)', { status: 404 })
  ),
  http.get(
    'https://api.github.com/repos/:owner/:repo/contents/:path*',
    ({ request }) => {
      const auth = request.headers.get('authorization');
      if (!auth)
        return HttpResponse.text('Requires auth (generic)', { status: 403 });
      return HttpResponse.text('Not Found (generic API)', { status: 404 });
    }
  ),
];
