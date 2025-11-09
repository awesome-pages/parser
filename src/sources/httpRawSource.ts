import type { CacheManager } from '@/cache/types';
import {
	MarkdownSourceError,
	UnsupportedMimeTypeError,
} from '@/sources/errors';
import { type FetchLike, resolveFetch } from '@/sources/helpers/resolveFetch';
import type { MarkdownSource } from '@/sources/types';

export interface HttpRawOptions {
	/** Allowed MIME types (default cobre os cenários comuns) */
	allowedContentTypes?: readonly string[];
	/** Timeout em ms (default 10s) */
	timeoutMs?: number;
	/** Limite de tamanho em bytes (Content-Length) antes de baixar (default: 2MB) */
	maxBytes?: number;
	/** Aceitar extensão .md como fallback mesmo que o Content-Type seja “genérico” */
	allowMdExtensionFallback?: boolean;
	/** User-Agent customizado (default: 'awesome-pages-parser') */
	userAgent?: string;
	/** Função de fetch injetável para testes */
	fetchFn?: FetchLike;
}

const DEFAULT_ALLOWED_CT = [
	'text/markdown',
	'text/x-markdown',
	'text/plain',
	'application/octet-stream',
] as const;

const DEFAULTS: Required<
	Pick<
		HttpRawOptions,
		| 'allowedContentTypes'
		| 'timeoutMs'
		| 'maxBytes'
		| 'allowMdExtensionFallback'
		| 'userAgent'
	>
> = {
	allowedContentTypes: DEFAULT_ALLOWED_CT,
	timeoutMs: 10_000,
	maxBytes: 2 * 1024 * 1024, // 2MB
	allowMdExtensionFallback: true,
	userAgent: 'awesome-pages-parser',
};

export class HttpRawSource implements MarkdownSource {
	constructor(
		private url: string,
		private opt: HttpRawOptions = {},
	) {}

	id(): string {
		return `http:${this.url}`;
	}

	async read(cache?: CacheManager): Promise<string> {
		const sourceId = this.id();
		const {
			allowedContentTypes,
			timeoutMs,
			maxBytes,
			allowMdExtensionFallback,
			userAgent,
		} = { ...DEFAULTS, ...this.opt };

		const fetchFn = await resolveFetch();

		// Timeout por AbortController
		const ctl = new AbortController();
		const timer = setTimeout(() => ctl.abort(), timeoutMs);

		const headers: Record<string, string> = {
			'User-Agent': userAgent,
			Accept: '*/*',
		};

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

		let res: Response;
		try {
			res = await fetchFn(this.url, {
				redirect: 'follow',
				headers,
				signal: ctl.signal,
			});
		} catch (err) {
			clearTimeout(timer);
			throw new MarkdownSourceError(
				`Network error for ${this.url}`,
				'HTTP_FETCH',
				err,
			);
		} finally {
			clearTimeout(timer);
		}

		// Handle 304 Not Modified
		let was304 = false;
		if (res.status === 304) {
			was304 = true;
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
			const freshHeaders = {
				'User-Agent': userAgent,
				Accept: '*/*',
			};
			const freshTimer = setTimeout(() => ctl.abort(), timeoutMs);
			try {
				res = await fetchFn(this.url, {
					redirect: 'follow',
					headers: freshHeaders,
					signal: ctl.signal,
				});
			} catch (err) {
				clearTimeout(freshTimer);
				throw new MarkdownSourceError(
					`Network error for ${this.url}`,
					'HTTP_FETCH',
					err,
				);
			} finally {
				clearTimeout(freshTimer);
			}
		}

		// Status check
		if (!res.ok) {
			let body = '';
			try {
				body = await res.text();
			} catch {
				/* ignore */
			}
			throw new MarkdownSourceError(
				`HTTP ${res.status} for ${this.url}`,
				'HTTP_STATUS',
				body.slice(0, 200),
			);
		}

		// Tamanho (Content-Length) se presente
		const lenHeader = res.headers.get('content-length');
		if (lenHeader) {
			const len = Number(lenHeader);
			if (!Number.isNaN(len) && len > maxBytes) {
				throw new MarkdownSourceError(
					`Response too large (${len} bytes) for ${this.url}`,
					'HTTP_MAX_SIZE',
				);
			}
		}

		// Content-Type check (com fallback de extensão .md)
		const ctFull = res.headers.get('content-type');
		const ct = ctFull ? ctFull.split(';')[0].trim().toLowerCase() : null;

		const isMdExt = this.url.toLowerCase().endsWith('.md');
		const ctAllowed = ct ? allowedContentTypes.includes(ct) : false;

		const accept = ctAllowed || (allowMdExtensionFallback && isMdExt);

		if (!accept) {
			throw new UnsupportedMimeTypeError(this.url, ct, allowedContentTypes);
		}

		// Baixa como texto (para streams enormes, poderia ler incrementalmente)
		const text = await res.text();

		// Checagem final de tamanho (caso Content-Length não estivesse presente)
		if (text.length > maxBytes) {
			throw new MarkdownSourceError(
				`Response too large after download (${text.length} bytes) for ${this.url}`,
				'HTTP_MAX_SIZE',
			);
		}

		// Update cache on successful response
		if (cache && !was304) {
			cache.setEntry(sourceId, {
				kind: 'remote',
				etag: res.headers.get('etag') || undefined,
				lastModified: res.headers.get('last-modified') || undefined,
				lastSeen: new Date().toISOString(),
				lastStatus: res.status,
			});
		}

		return text;
	}
}
