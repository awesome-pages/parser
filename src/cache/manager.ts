import fs from 'node:fs/promises';
import path from 'node:path';
import type {
	CacheEntry,
	CacheFile,
	CacheManager as ICacheManager,
} from './types';
import { CacheFileSchema } from './types';

/**
 * Implementation of cache manager that loads/saves cache from disk
 */
export class CacheManager implements ICacheManager {
	private entries: Map<string, CacheEntry>;
	private cachePath: string;

	constructor(
		cachePath: string,
		initialEntries: Record<string, CacheEntry> = {},
	) {
		this.cachePath = cachePath;
		this.entries = new Map(Object.entries(initialEntries));
	}

	getEntry(sourceId: string): CacheEntry | undefined {
		return this.entries.get(sourceId);
	}

	setEntry(sourceId: string, entry: CacheEntry): void {
		this.entries.set(sourceId, entry);
	}

	async save(): Promise<void> {
		const cacheFile: CacheFile = {
			version: 1,
			entries: Object.fromEntries(this.entries.entries()),
		};

		await fs.mkdir(path.dirname(this.cachePath), { recursive: true });
		await fs.writeFile(
			this.cachePath,
			JSON.stringify(cacheFile, null, 2),
			'utf8',
		);
	}

	/**
	 * Load cache from disk, creating empty cache if file doesn't exist or is corrupted
	 */
	static async load(cachePath: string): Promise<CacheManager> {
		try {
			const content = await fs.readFile(cachePath, 'utf8');
			const json = JSON.parse(content);
			const parsed = CacheFileSchema.safeParse(json);

			if (!parsed.success) {
				// Corrupted or version mismatch - start fresh
				console.warn(
					`Cache file at ${cachePath} is corrupted or has wrong version. Starting fresh.`,
				);
				return new CacheManager(cachePath);
			}

			return new CacheManager(cachePath, parsed.data.entries);
		} catch (err) {
			// File doesn't exist or can't be read - start fresh
			if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
				return new CacheManager(cachePath);
			}
			console.warn(`Failed to load cache from ${cachePath}:`, err);
			return new CacheManager(cachePath);
		}
	}
}

/**
 * No-op cache manager that doesn't read or write anything
 */
export class NoopCacheManager implements ICacheManager {
	getEntry(_sourceId: string): CacheEntry | undefined {
		return undefined;
	}

	setEntry(_sourceId: string, _entry: CacheEntry): void {
		// no-op
	}

	async save(): Promise<void> {
		// no-op
	}
}
