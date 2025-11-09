import fs from 'node:fs/promises';
import path from 'node:path';
import type { CacheManager } from '@/cache/types';
import type { MarkdownSource } from './types.js';

export class LocalFileSource implements MarkdownSource {
	constructor(private filepath: string) {}
	id() {
		return `local:${path.resolve(this.filepath)}`;
	}
	async read(cache?: CacheManager): Promise<string> {
		const sourceId = this.id();
		
		// Get file stats for cache
		if (cache) {
			const stats = await fs.stat(this.filepath);
			cache.setEntry(sourceId, {
				kind: 'local',
				mtimeMs: stats.mtimeMs,
				size: stats.size,
				lastSeen: new Date().toISOString(),
			});
		}
		
		return fs.readFile(this.filepath, 'utf8');
	}
}
