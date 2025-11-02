import fs from 'node:fs';
import path from 'node:path';
import { HttpResponse, http } from 'msw';

const fx = (name: string) =>
	fs.readFileSync(path.resolve(__dirname, 'httpRaw.fixtures', name), 'utf8');

export const handlers = [
	// OK: markdown
	http.get('https://example.com/readme.md', () =>
		HttpResponse.text(fx('readme.md'), {
			status: 200,
			headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
		}),
	),

	// OK: text/plain com .md (fallback por extensão)
	http.get('https://example.com/plain.md', () =>
		HttpResponse.text('Plain OK', {
			status: 200,
			headers: { 'Content-Type': 'text/plain' },
		}),
	),

	// HTML inválido para markdown
	http.get('https://example.com/readme', () =>
		HttpResponse.text('<html></html>', {
			status: 200,
			headers: { 'Content-Type': 'text/html' },
		}),
	),

	// 404
	http.get('https://example.com/missing.md', () =>
		HttpResponse.text('Not Found', { status: 404 }),
	),

	// grande demais
	http.get('https://example.com/huge.md', () =>
		HttpResponse.text('x'.repeat(3 * 1024 * 1024), {
			status: 200,
			headers: { 'Content-Type': 'text/markdown' },
		}),
	),
];
