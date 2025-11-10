import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { NoopCacheManager } from '@/cache/manager';
import type { RemoteCacheEntry } from '@/cache/types';
import { server } from '@/tests/server';
import { GitHubContentsApiSource } from './githubContents';

// Always avoid hitting gh CLI/token discovery during tests
vi.mock('@/sources/resolveGithubToken', () => ({
	resolveGithubToken: vi.fn(async () => undefined),
}));

class MockCacheManager extends NoopCacheManager {
	private entries = new Map<string, RemoteCacheEntry>();

	getEntry(sourceId: string): RemoteCacheEntry | undefined {
		return this.entries.get(sourceId);
	}

	setEntry(sourceId: string, entry: RemoteCacheEntry): void {
		if (entry.kind === 'remote') {
			this.entries.set(sourceId, entry);
		}
	}
}

describe('GitHubContentsApiSource with cache', () => {
	it('should handle 304 Not Modified on raw endpoint', async () => {
		const owner = 'test-owner';
		const repo = 'test-repo';
		const ref = 'main';
		const filePath = 'README.md';
		const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`;
		const etag = '"abc123"';
		let callCount = 0;

		server.use(
			http.get(rawUrl, ({ request }) => {
				callCount++;
				if (request.headers.get('if-none-match') === etag && callCount === 1) {
					return new HttpResponse(null, {
						status: 304,
						headers: { etag },
					});
				}
				return HttpResponse.text('# Cached Content from GitHub', {
					headers: { etag },
				});
			}),
		);

		const cache = new MockCacheManager();
		const sourceId = `github:${owner}/${repo}@${ref}:${filePath}`;
		cache.setEntry(sourceId, {
			kind: 'remote',
			etag,
			lastSeen: new Date().toISOString(),
		});

		const source = new GitHubContentsApiSource(owner, repo, ref, filePath);
		const content = await source.read(cache);

		expect(content).toBe('# Cached Content from GitHub');
		expect(callCount).toBe(2); // First 304, then fresh fetch

		const cachedEntry = cache.getEntry(sourceId);
		expect(cachedEntry?.lastStatus).toBe(304);
	});

	it('should update cache on successful fetch', async () => {
		const owner = 'test-owner';
		const repo = 'test-repo';
		const ref = 'main';
		const filePath = 'README.md';
		const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`;
		const etag = '"new-etag"';

		server.use(
			http.get(rawUrl, () => {
				return HttpResponse.text('# Fresh Content', {
					headers: {
						etag,
						'last-modified': 'Thu, 22 Oct 2015 08:00:00 GMT',
					},
				});
			}),
		);

		const cache = new MockCacheManager();
		const source = new GitHubContentsApiSource(owner, repo, ref, filePath);
		await source.read(cache);

		const sourceId = source.id();
		const entry = cache.getEntry(sourceId);

		expect(entry).toBeDefined();
		expect(entry?.etag).toBe(etag);
		expect(entry?.lastModified).toBe('Thu, 22 Oct 2015 08:00:00 GMT');
		expect(entry?.lastStatus).toBe(200);
	});

	it('should work without cache (backward compatibility)', async () => {
		const owner = 'test-owner';
		const repo = 'test-repo';
		const ref = 'main';
		const filePath = 'README.md';
		const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`;

		server.use(
			http.get(rawUrl, ({ request }) => {
				// Verify no conditional headers are sent
				expect(request.headers.get('if-none-match')).toBeNull();
				expect(request.headers.get('if-modified-since')).toBeNull();

				return HttpResponse.text('# Test Content');
			}),
		);

		const source = new GitHubContentsApiSource(owner, repo, ref, filePath);
		const content = await source.read(); // No cache passed

		expect(content).toBe('# Test Content');
	});
});
