import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NoopCacheManager } from '@/cache/manager';
import type { LocalCacheEntry } from '@/cache/types';
import { LocalFileSource } from './localFile';

class MockCacheManager extends NoopCacheManager {
	private entries = new Map<string, LocalCacheEntry>();

	getEntry(sourceId: string): LocalCacheEntry | undefined {
		return this.entries.get(sourceId);
	}

	setEntry(sourceId: string, entry: LocalCacheEntry): void {
		if (entry.kind === 'local') {
			this.entries.set(sourceId, entry);
		}
	}
}

describe('LocalFileSource with cache', () => {
	let tmpDir: string;
	let testFile: string;

	beforeEach(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-cache-test-'));
		testFile = path.join(tmpDir, 'test.md');
		await fs.writeFile(testFile, '# Test Content', 'utf8');
	});

	afterEach(async () => {
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	it('should update cache with file metadata on read', async () => {
		const cache = new MockCacheManager();
		const source = new LocalFileSource(testFile);

		await source.read(cache);

		const sourceId = source.id();
		const entry = cache.getEntry(sourceId);

		expect(entry).toBeDefined();
		expect(entry?.kind).toBe('local');
		if (entry?.kind === 'local') {
			expect(entry.mtimeMs).toBeGreaterThan(0);
			expect(entry.size).toBe('# Test Content'.length);
			expect(entry.lastSeen).toBeDefined();
		}
	});

	it('should detect file changes via mtimeMs', async () => {
		const cache = new MockCacheManager();
		const source = new LocalFileSource(testFile);

		// First read
		await source.read(cache);
		const firstEntry = cache.getEntry(source.id());

		// Wait a bit and modify file
		await new Promise((resolve) => setTimeout(resolve, 10));
		await fs.writeFile(testFile, '# Modified Content', 'utf8');

		// Second read
		await source.read(cache);
		const secondEntry = cache.getEntry(source.id());

		expect(secondEntry?.kind).toBe('local');
		if (firstEntry?.kind === 'local' && secondEntry?.kind === 'local') {
			expect(secondEntry.mtimeMs).toBeGreaterThan(firstEntry.mtimeMs);
			expect(secondEntry.size).not.toBe(firstEntry.size);
		}
	});

	it('should work without cache', async () => {
		const source = new LocalFileSource(testFile);
		const content = await source.read(); // No cache passed

		expect(content).toBe('# Test Content');
	});

	it('should use absolute path in source id', async () => {
		const source = new LocalFileSource(testFile);
		const id = source.id();

		expect(id).toContain('local:');
		expect(path.isAbsolute(id.replace('local:', ''))).toBe(true);
	});
});
