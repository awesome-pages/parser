import path from 'node:path';
import slugify from '@/schemas/helpers/slugify';

export interface PlaceholderContext {
	/** Directory relative to rootDir (for local files) or repo path dir (for github) */
	dir: string;
	/** Basename without extension (slugified) */
	name: string;
	/** File extension without dot (e.g. "md", "json") */
	ext: string;
	/** GitHub owner (slugified), when available */
	owner?: string;
	/** GitHub repo (slugified), when available */
	repo?: string;
	/** Git ref (slugified), when available */
	ref?: string;
	/** Path inside the repo, when available (raw, not slugified) */
	path?: string;
}

function normalizeSegment(segment: string): string {
	if (!segment) return '';
	// reaproveita seu slugify e garante que não entra lixo em path
	const s = slugify(segment);
	return s.replace(/[^a-z0-9/_.-]+/g, '-');
}

function buildLocalContext(
	input: string,
	rootDir: string,
): Pick<PlaceholderContext, 'dir' | 'name' | 'ext'> {
	const abs = path.isAbsolute(input) ? input : path.join(rootDir, input);
	const rel = path.relative(rootDir, abs) || path.basename(abs);

	const dirRaw = path.dirname(rel);
	const base = path.basename(rel);
	const ext = path.extname(base).slice(1); // sem o ponto
	const nameRaw = ext ? base.slice(0, -(ext.length + 1)) : base;

	return {
		dir: normalizeSegment(dirRaw === '.' ? '' : dirRaw),
		name: normalizeSegment(nameRaw),
		ext,
	};
}

function buildGithubContext(sourceId: string): PlaceholderContext {
	// Formato esperado: github:owner/repo@ref:path/to/file.md
	const m = sourceId.match(/^github:([^/]+)\/([^@]+)@([^:]+):(.+)$/);

	if (!m) {
		// fallback mínimo
		return {
			dir: '',
			name: 'readme',
			ext: 'md',
		};
	}

	const [, ownerRaw, repoRaw, refRaw, pathInRepo] = m;
	const base = path.basename(pathInRepo || 'README.md');
	const ext = path.extname(base).slice(1);
	const nameRaw = ext ? base.slice(0, -(ext.length + 1)) : base;
	const dirRaw = path.dirname(pathInRepo);

	return {
		dir: normalizeSegment(dirRaw === '.' ? '' : dirRaw),
		name: normalizeSegment(nameRaw),
		ext,
		owner: normalizeSegment(ownerRaw),
		repo: normalizeSegment(repoRaw),
		ref: normalizeSegment(refRaw),
		path: pathInRepo,
	};
}

function buildHttpContext(sourceId: string): PlaceholderContext {
	// sourceId esperado: "http:https://example.com/foo/bar.md"
	const urlStr = sourceId.replace(/^http:/, '');

	let url: URL;
	try {
		url = new URL(urlStr);
	} catch {
		return {
			dir: '',
			name: 'index',
			ext: '',
		};
	}

	const pathname = url.pathname || '/';
	const base = path.basename(pathname) || 'index';
	const ext = path.extname(base).slice(1);
	const nameRaw = ext ? base.slice(0, -(ext.length + 1)) : base;
	const dirRaw = path.dirname(pathname);

	return {
		dir: normalizeSegment(dirRaw === '/' || dirRaw === '.' ? '' : dirRaw),
		name: normalizeSegment(nameRaw),
		ext,
	};
}

export function buildPlaceholderContext(params: {
	input: string;
	sourceId: string;
	rootDir: string;
}): PlaceholderContext {
	const { input, sourceId, rootDir } = params;

	if (sourceId.startsWith('github:')) {
		return buildGithubContext(sourceId);
	}

	if (sourceId.startsWith('http:')) {
		return buildHttpContext(sourceId);
	}

	// default: trata como arquivo local
	return buildLocalContext(input, rootDir);
}
