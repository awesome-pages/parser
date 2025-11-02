import { describe, expect, it } from 'vitest';
import { UnsupportedMimeTypeError } from '@/sources/errors';
import { HttpRawSource } from '@/sources/httpRawSource';

describe('HttpRawSource + MSW', () => {
	it('downloads markdown successfully when content-type is text/markdown', async () => {
		const src = new HttpRawSource('https://example.com/readme.md');
		const text = await src.read();
		expect(text.trim()).toBe('# Hello');
	});

	it('accepts text/plain when URL ends with .md (extension fallback)', async () => {
		const src = new HttpRawSource('https://example.com/plain.md');
		const text = await src.read();
		expect(text).toBe('Plain OK');
	});

	it('rejects unsupported MIME type when URL does not end with .md', async () => {
		const src = new HttpRawSource('https://example.com/readme');
		await expect(src.read()).rejects.toBeInstanceOf(UnsupportedMimeTypeError);
	});

	it('returns HTTP_STATUS error on non-OK responses (e.g., 404)', async () => {
		const src = new HttpRawSource('https://example.com/missing.md');
		await expect(src.read()).rejects.toMatchObject({ code: 'HTTP_STATUS' });
	});

	it('aborts on large Content-Length before download', async () => {
		const src = new HttpRawSource('https://example.com/huge.md', {
			maxBytes: 1024,
		});
		await expect(src.read()).rejects.toMatchObject({ code: 'HTTP_MAX_SIZE' });
	});
});
