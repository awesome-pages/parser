import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/server';
import { HttpRawSource } from './httpRawSource';
import { NoopCacheManager } from '@/cache/manager';
import type { RemoteCacheEntry } from '@/cache/types';

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

describe('HttpRawSource with cache', () => {
	const testUrl = 'https://example.com/test.md';

	beforeEach(() => {
		server.resetHandlers();
	});

	it('should send If-None-Match header when etag is cached', async () => {
		let requestHeaders: Headers | undefined;

		server.use(
			http.get(testUrl, ({ request }) => {
				requestHeaders = request.headers;
				return HttpResponse.text('# Test', {
					headers: {
						'content-type': 'text/markdown',
						etag: '"abc123"',
					},
				});
			}),
		);

		const cache = new MockCacheManager();
		cache.setEntry(`http:${testUrl}`, {
			kind: 'remote',
			etag: '"abc123"',
			lastSeen: new Date().toISOString(),
		});

		const source = new HttpRawSource(testUrl);
		await source.read(cache);

		expect(requestHeaders?.get('if-none-match')).toBe('"abc123"');
	});

	it('should send If-Modified-Since header when lastModified is cached', async () => {
		let requestHeaders: Headers | undefined;
		const lastMod = 'Wed, 21 Oct 2015 07:28:00 GMT';

		server.use(
			http.get(testUrl, ({ request }) => {
				requestHeaders = request.headers;
				return HttpResponse.text('# Test', {
					headers: {
						'content-type': 'text/markdown',
						'last-modified': lastMod,
					},
				});
			}),
		);

		const cache = new MockCacheManager();
		cache.setEntry(`http:${testUrl}`, {
			kind: 'remote',
			lastModified: lastMod,
			lastSeen: new Date().toISOString(),
		});

		const source = new HttpRawSource(testUrl);
		await source.read(cache);

		expect(requestHeaders?.get('if-modified-since')).toBe(lastMod);
	});

	it('should handle 304 Not Modified response', async () => {
		const etag = '"abc123"';
		let callCount = 0;

		server.use(
			http.get(testUrl, ({ request }) => {
				callCount++;
				if (request.headers.get('if-none-match') === etag && callCount === 1) {
					return new HttpResponse(null, {
						status: 304,
						headers: { etag },
					});
				}
				return HttpResponse.text('# Cached Content', {
					headers: {
						'content-type': 'text/markdown',
						etag,
					},
				});
			}),
		);

		const cache = new MockCacheManager();
		cache.setEntry(`http:${testUrl}`, {
			kind: 'remote',
			etag,
			lastSeen: new Date().toISOString(),
		});

		const source = new HttpRawSource(testUrl);
		const content = await source.read(cache);

		expect(content).toBe('# Cached Content');
		expect(callCount).toBe(2); // First 304, then fresh fetch
		
		const cachedEntry = cache.getEntry(`http:${testUrl}`);
		expect(cachedEntry?.lastStatus).toBe(304);
	});

	it('should update cache with etag and lastModified on successful response', async () => {
		const etag = '"new-etag"';
		const lastMod = 'Thu, 22 Oct 2015 08:00:00 GMT';

		server.use(
			http.get(testUrl, () => {
				return HttpResponse.text('# Fresh Content', {
					headers: {
						'content-type': 'text/markdown',
						etag,
						'last-modified': lastMod,
					},
				});
			}),
		);

		const cache = new MockCacheManager();
		const source = new HttpRawSource(testUrl);
		await source.read(cache);

		const entry = cache.getEntry(`http:${testUrl}`);
		expect(entry).toBeDefined();
		expect(entry?.etag).toBe(etag);
		expect(entry?.lastModified).toBe(lastMod);
		expect(entry?.lastStatus).toBe(200);
	});

	it('should work without cache (no conditional headers)', async () => {
		let requestHeaders: Headers | undefined;

		server.use(
			http.get(testUrl, ({ request }) => {
				requestHeaders = request.headers;
				return HttpResponse.text('# Test', {
					headers: { 'content-type': 'text/markdown' },
				});
			}),
		);

		const source = new HttpRawSource(testUrl);
		const content = await source.read(); // No cache passed

		expect(content).toBe('# Test');
		expect(requestHeaders?.get('if-none-match')).toBeNull();
		expect(requestHeaders?.get('if-modified-since')).toBeNull();
	});
});
