import { z } from 'zod';
import type { CacheManager } from '@/cache/types';
import {
	GitHubApiError,
	type MarkdownSourceError,
	NotFoundError,
	PrivateRepoError,
	RawFetchError,
} from '@/sources/errors';
import { resolveFetch } from '@/sources/helpers/resolveFetch';
import { resolveGithubToken } from '@/sources/resolveGithubToken';
import type { MarkdownSource } from '@/sources/types';

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
		private token?: string,
	) {}
	id() {
		return `github:${this.owner}/${this.repo}@${this.ref}:${this.filePath}`;
	}

	async read(cache?: CacheManager): Promise<string> {
		const sourceId = this.id();
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

		// Add conditional headers from cache
		if (cache) {
			const cached = cache.getEntry(sourceId);
			if (cached && cached.kind === 'remote') {
				if (cached.etag) {
					headers['If-None-Match'] = cached.etag;
				}
				if (cached.lastModified) {
					headers['If-Modified-Since'] = cached.lastModified;
				}
			}
		}

		const fetchFn = await resolveFetch();

		// --- RAW-FIRST when no token (fast path for public repos) ---
		let rawFallbackHint: MarkdownSourceError | null = null;
		if (!token) {
			const rawUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.ref}/${this.filePath}`;
			const rawHeaders: Record<string, string> = {};
			
			// Add conditional headers for raw endpoint too
			if (cache) {
				const cached = cache.getEntry(sourceId);
				if (cached && cached.kind === 'remote') {
					if (cached.etag) {
						rawHeaders['If-None-Match'] = cached.etag;
					}
					if (cached.lastModified) {
						rawHeaders['If-Modified-Since'] = cached.lastModified;
					}
				}
			}

			const rawRes = await fetchFn(rawUrl, Object.keys(rawHeaders).length > 0 ? { headers: rawHeaders } : undefined);
			
			if (rawRes.status === 304) {
				// Content not modified - update cache and re-fetch without conditional headers
				// (we don't store content, so we need to fetch again)
				if (cache) {
					cache.setEntry(sourceId, {
						kind: 'remote',
						etag: rawRes.headers.get('etag') || undefined,
						lastModified: rawRes.headers.get('last-modified') || undefined,
						lastSeen: new Date().toISOString(),
						lastStatus: 304,
					});
				}
				// Fetch again without conditional headers to get the content
				const freshRes = await fetchFn(rawUrl);
				if (freshRes.ok) {
					return await freshRes.text();
				}
			}
			
			if (rawRes.ok) {
				// Update cache on successful response
				if (cache) {
					cache.setEntry(sourceId, {
						kind: 'remote',
						etag: rawRes.headers.get('etag') || undefined,
						lastModified: rawRes.headers.get('last-modified') || undefined,
						lastSeen: new Date().toISOString(),
						lastStatus: rawRes.status,
					});
				}
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

		// Handle 304 Not Modified
		if (res.status === 304) {
			if (cache) {
				cache.setEntry(sourceId, {
					kind: 'remote',
					etag: res.headers.get('etag') || undefined,
					lastModified: res.headers.get('last-modified') || undefined,
					lastSeen: new Date().toISOString(),
					lastStatus: 304,
				});
			}
			// Fetch again without conditional headers to get the content
			const freshHeaders = { ...headers };
			delete freshHeaders['If-None-Match'];
			delete freshHeaders['If-Modified-Since'];
			const freshRes = await fetchFn(url, { headers: freshHeaders });
			if (!freshRes.ok) {
				const body = await freshRes.text().catch(() => '');
				throw new GitHubApiError(freshRes.status, this.id(), body);
			}
			const raw = await freshRes.json();
			const parsed = GHContentsSchema.safeParse(raw);
			if (!parsed.success) {
				throw new GitHubApiError(
					200,
					this.id(),
					'Unexpected GitHub contents response shape',
				);
			}
			const buf = Buffer.from(parsed.data.content, 'base64');
			return buf.toString('utf8');
		}

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
				'Unexpected GitHub contents response shape',
			);
		}
		
		// Update cache on successful response
		if (cache) {
			cache.setEntry(sourceId, {
				kind: 'remote',
				etag: res.headers.get('etag') || undefined,
				lastModified: res.headers.get('last-modified') || undefined,
				lastSeen: new Date().toISOString(),
				lastStatus: res.status,
			});
		}
		
		const buf = Buffer.from(parsed.data.content, 'base64');
		return buf.toString('utf8');
	}
}
