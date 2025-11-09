import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CacheManager, NoopCacheManager } from './manager';
import type { LocalCacheEntry, RemoteCacheEntry } from './types';

describe('CacheManager', () => {
	let tmpDir: string;
	let cachePath: string;

	beforeEach(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-test-'));
		cachePath = path.join(tmpDir, 'cache.v1.json');
	});

	afterEach(async () => {
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	it('should create empty cache when file does not exist', async () => {
		const cache = await CacheManager.load(cachePath);
		expect(cache.getEntry('test')).toBeUndefined();
	});

	it('should set and get remote cache entry', async () => {
		const cache = await CacheManager.load(cachePath);
		const entry: RemoteCacheEntry = {
			kind: 'remote',
			etag: '"abc123"',
			lastModified: 'Wed, 21 Oct 2015 07:28:00 GMT',
			lastSeen: new Date().toISOString(),
			lastStatus: 200,
		};

		cache.setEntry('github:owner/repo@main:README.md', entry);
		const retrieved = cache.getEntry('github:owner/repo@main:README.md');

		expect(retrieved).toEqual(entry);
	});

	it('should set and get local cache entry', async () => {
		const cache = await CacheManager.load(cachePath);
		const entry: LocalCacheEntry = {
			kind: 'local',
			mtimeMs: 1234567890123.456,
			size: 5432,
			lastSeen: new Date().toISOString(),
		};

		cache.setEntry('local:/path/to/file.md', entry);
		const retrieved = cache.getEntry('local:/path/to/file.md');

		expect(retrieved).toEqual(entry);
	});

	it('should save cache to disk', async () => {
		const cache = await CacheManager.load(cachePath);
		cache.setEntry('test-id', {
			kind: 'remote',
			etag: '"test"',
			lastSeen: new Date().toISOString(),
		});

		await cache.save();

		const exists = await fs
			.access(cachePath)
			.then(() => true)
			.catch(() => false);
		expect(exists).toBe(true);
	});

	it('should load previously saved cache', async () => {
		const cache1 = await CacheManager.load(cachePath);
		cache1.setEntry('test-id', {
			kind: 'remote',
			etag: '"saved"',
			lastSeen: new Date().toISOString(),
		});
		await cache1.save();

		const cache2 = await CacheManager.load(cachePath);
		const entry = cache2.getEntry('test-id');

		expect(entry).toBeDefined();
		expect(entry?.kind).toBe('remote');
		if (entry?.kind === 'remote') {
			expect(entry.etag).toBe('"saved"');
		}
	});

	it('should handle corrupted cache file gracefully', async () => {
		await fs.mkdir(path.dirname(cachePath), { recursive: true });
		await fs.writeFile(cachePath, 'invalid json {', 'utf8');

		const cache = await CacheManager.load(cachePath);
		expect(cache.getEntry('test')).toBeUndefined();
	});

	it('should handle wrong version gracefully', async () => {
		await fs.mkdir(path.dirname(cachePath), { recursive: true });
		await fs.writeFile(
			cachePath,
			JSON.stringify({ version: 999, entries: {} }),
			'utf8',
		);

		const cache = await CacheManager.load(cachePath);
		expect(cache.getEntry('test')).toBeUndefined();
	});

	it('should persist multiple entries', async () => {
		const cache = await CacheManager.load(cachePath);

		cache.setEntry('remote-1', {
			kind: 'remote',
			etag: '"etag1"',
			lastSeen: new Date().toISOString(),
		});

		cache.setEntry('local-1', {
			kind: 'local',
			mtimeMs: 123456,
			size: 100,
			lastSeen: new Date().toISOString(),
		});

		await cache.save();

		const cache2 = await CacheManager.load(cachePath);
		expect(cache2.getEntry('remote-1')).toBeDefined();
		expect(cache2.getEntry('local-1')).toBeDefined();
	});
});

describe('NoopCacheManager', () => {
	it('should not store entries', () => {
		const cache = new NoopCacheManager();
		cache.setEntry('test', {
			kind: 'remote',
			etag: '"test"',
			lastSeen: new Date().toISOString(),
		});

		expect(cache.getEntry('test')).toBeUndefined();
	});

	it('should have no-op save', async () => {
		const cache = new NoopCacheManager();
		await expect(cache.save()).resolves.toBeUndefined();
	});
});
