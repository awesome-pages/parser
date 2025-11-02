import { MarkdownSource } from '@/sources/types';
import { z } from 'zod';
import {
  MarkdownSourceError,
  RawFetchError,
  PrivateRepoError,
  NotFoundError,
  GitHubApiError,
} from '@/sources/errors';
import { resolveGithubToken } from '@/sources/resolveGithubToken';

type FetchLike = (
  input: string,
  init?: { headers?: Record<string, string> }
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

const GHContentsSchema = z.object({
  content: z.string(),
  encoding: z.literal('base64'),
});

// Minimal Contents API client
export class GitHubContentsApiSource implements MarkdownSource {
  constructor(
    private owner: string,
    private repo: string,
    private ref: string,
    private filePath: string,
    private token?: string
  ) {}
  id() {
    return `github:${this.owner}/${this.repo}@${this.ref}:${this.filePath}`;
  }

  async read(): Promise<string> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(this.filePath)}?ref=${encodeURIComponent(this.ref)}`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'awesome-pages-parser',
    };
    const token =
      this.token ??
      (await resolveGithubToken({
        host: 'github.com',
        owner: this.owner,
        repo: this.repo,
      }));
    if (token) headers.Authorization = `Bearer ${token}`;

    // resolve fetch at runtime: use global fetch if available, otherwise fall back to node-fetch (ESM)
    const fetchFn: FetchLike =
      (globalThis as unknown as { fetch?: FetchLike }).fetch ??
      ((await import('node-fetch')).default as unknown as FetchLike);

    // --- RAW-FIRST when no token (fast path for public repos) ---
    let rawFallbackHint: MarkdownSourceError | null = null;
    if (!token) {
      const rawUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.ref}/${this.filePath}`;
      const rawRes = await fetchFn(rawUrl);
      if (rawRes.ok) {
        return await rawRes.text();
      }
      // RAW failed → for 403/404 we keep a typed hint and fall through to the Contents API
      if (rawRes.status === 403) {
        rawFallbackHint = new PrivateRepoError(this.id());
      } else if (rawRes.status === 404) {
        rawFallbackHint = new NotFoundError(this.id());
      } else {
        const body = await rawRes.text().catch(() => '');
        throw new RawFetchError(rawRes.status, this.id(), body.slice(0, 200));
      }
    }

    const res = await fetchFn(url, { headers });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (rawFallbackHint) {
        rawFallbackHint.cause = body;
        throw rawFallbackHint;
      }
      throw new GitHubApiError(res.status, this.id(), body);
    }

    const raw = await res.json();
    const parsed = GHContentsSchema.safeParse(raw);
    if (!parsed.success) {
      throw new GitHubApiError(
        200,
        this.id(),
        'Unexpected GitHub contents response shape'
      );
    }
    const buf = Buffer.from(parsed.data.content, 'base64');
    return buf.toString('utf8');
  }
}
