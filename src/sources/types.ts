import type { CacheManager } from '@/cache/types';

export interface MarkdownSource {
	read(cache?: CacheManager): Promise<string>;
	id(): string;
}
