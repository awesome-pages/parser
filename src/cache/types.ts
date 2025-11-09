import { z } from 'zod';

/**
 * Cache entry for remote sources (GitHub, HTTP)
 */
export const RemoteCacheEntrySchema = z.object({
	kind: z.literal('remote'),
	etag: z.string().optional(),
	lastModified: z.string().optional(),
	lastSeen: z.string(),
	lastStatus: z.number().int().optional(),
});

export type RemoteCacheEntry = z.infer<typeof RemoteCacheEntrySchema>;

/**
 * Cache entry for local file sources
 */
export const LocalCacheEntrySchema = z.object({
	kind: z.literal('local'),
	mtimeMs: z.number(),
	size: z.number().int(),
	lastSeen: z.string(),
});

export type LocalCacheEntry = z.infer<typeof LocalCacheEntrySchema>;

/**
 * Union of all cache entry types
 */
export const CacheEntrySchema = z.discriminatedUnion('kind', [
	RemoteCacheEntrySchema,
	LocalCacheEntrySchema,
]);

export type CacheEntry = z.infer<typeof CacheEntrySchema>;

/**
 * The cache file structure
 */
export const CacheFileSchema = z.object({
	version: z.literal(1),
	entries: z.record(z.string(), CacheEntrySchema),
});

export type CacheFile = z.infer<typeof CacheFileSchema>;

/**
 * Interface for cache operations
 */
export interface CacheManager {
	getEntry(sourceId: string): CacheEntry | undefined;
	setEntry(sourceId: string, entry: CacheEntry): void;
	save(): Promise<void>;
}
