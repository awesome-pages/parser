import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse } from './index';

describe('parse() with cache', () => {
	let tmpDir: string;
	let testFile: string;
	let cachePath: string;

	beforeEach(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'parse-cache-test-'));
		testFile = path.join(tmpDir, 'test.md');
		cachePath = path.join(tmpDir, '.awesome-pages', 'cache.v1.json');

		await fs.writeFile(
			testFile,
			'# Awesome List\n\nA test list\n\n## Category\n\n- [Item](https://example.com)',
			'utf8',
		);
	});

	afterEach(async () => {
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	it('should create cache file on first run', async () => {
		await parse({
			rootDir: tmpDir,
			sources: [
				{
					from: testFile,
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		});

		const cacheExists = await fs
			.access(cachePath)
			.then(() => true)
			.catch(() => false);

		expect(cacheExists).toBe(true);
	});

	it('should populate cache with local file metadata', async () => {
		await parse({
			rootDir: tmpDir,
			sources: [
				{
					from: testFile,
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		});

		const cacheContent = await fs.readFile(cachePath, 'utf8');
		const cache = JSON.parse(cacheContent);

		expect(cache.version).toBe(1);
		expect(cache.entries).toBeDefined();

		const sourceId = `local:${testFile}`;
		expect(cache.entries[sourceId]).toBeDefined();
		expect(cache.entries[sourceId].kind).toBe('local');
		expect(cache.entries[sourceId].mtimeMs).toBeGreaterThan(0);
		expect(cache.entries[sourceId].size).toBeGreaterThan(0);
	});

	it('should reuse cache on subsequent runs', async () => {
		// First run
		await parse({
			rootDir: tmpDir,
			sources: [
				{
					from: testFile,
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		});

		const firstCache = JSON.parse(await fs.readFile(cachePath, 'utf8'));
		const sourceId = `local:${testFile}`;
		const firstMtime = firstCache.entries[sourceId].mtimeMs;

		// Second run (file unchanged)
		await parse({
			rootDir: tmpDir,
			sources: [
				{
					from: testFile,
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		});

		const secondCache = JSON.parse(await fs.readFile(cachePath, 'utf8'));
		const secondMtime = secondCache.entries[sourceId].mtimeMs;

		// mtimeMs should be the same since file didn't change
		expect(secondMtime).toBe(firstMtime);
	});

	it('should not create cache when cache=false', async () => {
		await parse({
			rootDir: tmpDir,
			cache: false,
			sources: [
				{
					from: testFile,
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		});

		const cacheExists = await fs
			.access(cachePath)
			.then(() => true)
			.catch(() => false);

		expect(cacheExists).toBe(false);
	});

	it('should use custom cachePath when provided', async () => {
		const customCachePath = path.join(tmpDir, 'custom-cache.json');

		await parse({
			rootDir: tmpDir,
			cachePath: customCachePath,
			sources: [
				{
					from: testFile,
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		});

		const cacheExists = await fs
			.access(customCachePath)
			.then(() => true)
			.catch(() => false);

		expect(cacheExists).toBe(true);
	});

	it('should handle multiple sources in cache', async () => {
		const testFile2 = path.join(tmpDir, 'test2.md');
		await fs.writeFile(testFile2, '# Another List\n\nAnother test', 'utf8');

		await parse({
			rootDir: tmpDir,
			sources: [
				{
					from: [testFile, testFile2],
					outputs: [{ artifact: 'domain', to: '{name}.json' }],
				},
			],
		});

		const cache = JSON.parse(await fs.readFile(cachePath, 'utf8'));

		expect(Object.keys(cache.entries)).toHaveLength(2);
		expect(cache.entries[`local:${testFile}`]).toBeDefined();
		expect(cache.entries[`local:${testFile2}`]).toBeDefined();
	});
});
