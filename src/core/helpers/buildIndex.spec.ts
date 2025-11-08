import { describe, it, expect } from 'vitest';
import { tokenize, buildIndex } from './buildIndex';
import type { DomainV1 } from '@/schemas/v1/domain.v1';

describe('tokenize', () => {
	it('should convert text to lowercase', () => {
		expect(tokenize('Hello WORLD')).toEqual(['hello', 'world']);
	});

	it('should remove punctuation', () => {
		expect(tokenize('Hello, World!')).toEqual(['hello', 'world']);
		expect(tokenize('test (with) [brackets] {and} more')).toEqual([
			'test',
			'with',
			'brackets',
			'and',
			'more',
		]);
	});

	it('should split on whitespace and hyphens', () => {
		expect(tokenize('test-driven development')).toEqual([
			'test',
			'driven',
			'development',
		]);
		expect(tokenize('some_underscore_text')).toEqual([
			'some',
			'underscore',
			'text',
		]);
	});

	it('should remove stopwords', () => {
		const result = tokenize('This is a test of the system');
		expect(result).toEqual(['this', 'test', 'system']);
		expect(result).not.toContain('is');
		expect(result).not.toContain('a');
		expect(result).not.toContain('of');
		expect(result).not.toContain('the');
	});

	it('should normalize version suffixes', () => {
		expect(tokenize('Vue v2')).toEqual(['vue', 'v']);
		expect(tokenize('React v3.1')).toEqual(['react', 'v']);
		expect(tokenize('Angular v17.0.0')).toEqual(['angular', 'v']);
	});

	it('should handle empty or null input', () => {
		expect(tokenize('')).toEqual([]);
		expect(tokenize(null as any)).toEqual([]);
		expect(tokenize(undefined as any)).toEqual([]);
	});

	it('should handle text with multiple spaces', () => {
		expect(tokenize('hello    world')).toEqual(['hello', 'world']);
	});

	it('should handle complex real-world examples', () => {
		expect(tokenize('SVG optimizer for web developers')).toEqual([
			'svg',
			'optimizer',
			'web',
			'developers',
		]);
		expect(tokenize('JavaScript (ES6+) library')).toEqual([
			'javascript',
			'es6',
			'library',
		]);
	});
});

describe('buildIndex', () => {
	it('should create an empty index for a domain with no items', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test',
				generatedAt: '2025-11-08T00:00:00.000Z',
				source: 'test',
			},
			sections: [],
			items: [],
		};

		const index = buildIndex(domain);

		expect(index.schemaVersion).toBe(1);
		expect(index.meta.source).toBe('test');
		expect(index.meta.generatedAt).toBe('2025-11-08T00:00:00.000Z');
		expect(index.meta.fieldWeights).toEqual({
			title: 2,
			description: 1,
			tags: 1.5,
		});
		expect(index.stats).toEqual({
			docs: 0,
			terms: 0,
		});
		expect(index.docs).toEqual({});
		expect(index.terms).toEqual({});
	});

	it('should index a single item with title only', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T00:00:00.000Z',
				source: 'test',
			},
			sections: [
				{
					id: 'tools',
					title: 'Tools',
					parentId: null,
					depth: 1,
					order: 0,
					path: 'tools',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'svgomg',
					sectionId: 'tools',
					title: 'SVGOMG',
					url: 'https://jakearchibald.github.io/svgomg/',
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const index = buildIndex(domain);

		expect(index.docs).toEqual({
			svgomg: {
				title: 'SVGOMG',
				url: 'https://jakearchibald.github.io/svgomg/',
				sectionId: 'tools',
			},
		});

		expect(index.terms.svgomg).toEqual([{ id: 'svgomg', f: 2 }]); // title weight = 2
	});

	it('should index items with title, description, and tags', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T00:00:00.000Z',
				source: 'test',
			},
			sections: [
				{
					id: 'tools',
					title: 'Tools',
					parentId: null,
					depth: 1,
					order: 0,
					path: 'tools',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'svg-optimizer',
					sectionId: 'tools',
					title: 'SVG Optimizer',
					url: 'https://svgoptimizer.com/',
					description: 'A tool to optimize SVG files',
					descriptionHtml: null,
					order: 0,
					tags: ['svg', 'optimization', 'web'],
				},
			],
		};

		const index = buildIndex(domain);

		expect(index.docs['svg-optimizer']).toEqual({
			title: 'SVG Optimizer',
			url: 'https://svgoptimizer.com/',
			sectionId: 'tools',
		});

		// 'svg' appears in: title (1×2=2) + description (1×1=1) + tags (1×1.5=1.5) = 4.5
		expect(index.terms.svg).toContainEqual({ id: 'svg-optimizer', f: 4.5 });

		// 'optimizer' appears in: title (1×2=2)
		expect(index.terms.optimizer).toContainEqual({
			id: 'svg-optimizer',
			f: 2,
		});

		// 'tool' appears in: description (1×1=1)
		expect(index.terms.tool).toContainEqual({ id: 'svg-optimizer', f: 1 });

		// 'optimize' appears in: description (1×1=1)
		expect(index.terms.optimize).toContainEqual({ id: 'svg-optimizer', f: 1 });

		// 'optimization' appears in: tags (1×1.5=1.5)
		expect(index.terms.optimization).toContainEqual({
			id: 'svg-optimizer',
			f: 1.5,
		});

		// 'web' appears in: tags (1×1.5=1.5)
		expect(index.terms.web).toContainEqual({ id: 'svg-optimizer', f: 1.5 });
	});

	it('should handle multiple items with shared terms', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T00:00:00.000Z',
				source: 'test',
			},
			sections: [
				{
					id: 'tools',
					title: 'Tools',
					parentId: null,
					depth: 1,
					order: 0,
					path: 'tools',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'svgomg',
					sectionId: 'tools',
					title: 'SVGOMG',
					url: 'https://jakearchibald.github.io/svgomg/',
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
				{
					id: 'svg-optimizer',
					sectionId: 'tools',
					title: 'SVG Optimizer',
					url: 'https://svgoptimizer.com/',
					description: null,
					descriptionHtml: null,
					order: 1,
					tags: [],
				},
			],
		};

		const index = buildIndex(domain);

		expect(index.terms.svg).toHaveLength(2);
		expect(index.terms.svg).toContainEqual({ id: 'svgomg', f: 2 });
		expect(index.terms.svg).toContainEqual({ id: 'svg-optimizer', f: 2 });

		expect(index.terms.optimizer).toHaveLength(1);
		expect(index.terms.optimizer).toContainEqual({
			id: 'svg-optimizer',
			f: 2,
		});
	});

	it('should sort postings by frequency descending', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T00:00:00.000Z',
				source: 'test',
			},
			sections: [
				{
					id: 'tools',
					title: 'Tools',
					parentId: null,
					depth: 1,
					order: 0,
					path: 'tools',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'item1',
					sectionId: 'tools',
					title: 'Tool', // 'tool' appears 1 time, weight 2
					url: 'https://example.com/1',
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
				{
					id: 'item2',
					sectionId: 'tools',
					title: 'Tool Tool', // 'tool' appears 2 times, weight 4
					url: 'https://example.com/2',
					description: null,
					descriptionHtml: null,
					order: 1,
					tags: [],
				},
				{
					id: 'item3',
					sectionId: 'tools',
					title: 'Tool',
					url: 'https://example.com/3',
					description: 'Another tool here', // 'tool' in title (2) + description (1) = 3
					descriptionHtml: null,
					order: 2,
					tags: [],
				},
			],
		};

		const index = buildIndex(domain);

		expect(index.terms.tool).toEqual([
			{ id: 'item2', f: 4 },
			{ id: 'item3', f: 3 },
			{ id: 'item1', f: 2 },
		]);
	});

	it('should handle items without URLs', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T00:00:00.000Z',
				source: 'test',
			},
			sections: [
				{
					id: 'tools',
					title: 'Tools',
					parentId: null,
					depth: 1,
					order: 0,
					path: 'tools',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'no-url',
					sectionId: 'tools',
					title: 'Item Without URL',
					url: undefined,
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const index = buildIndex(domain);

		expect(index.docs['no-url']).toEqual({
			title: 'Item Without URL',
			url: undefined,
			sectionId: 'tools',
		});
	});

	it('should preserve meta information from domain', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Awesome List',
				description: 'A curated list',
				generatedAt: '2025-11-08T12:34:56.789Z',
				source: 'github:owner/repo@main:README.md',
			},
			sections: [],
			items: [],
		};

		const index = buildIndex(domain);

		expect(index.meta.repo).toBe('owner/repo');
		expect(index.meta.ref).toBe('main');
		expect(index.meta.path).toBe('README.md');
		expect(index.meta.generatedAt).toBe('2025-11-08T12:34:56.789Z');
	});

	it('should handle complex real-world example', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T00:00:00.000Z',
				source: 'github:owner/repo@ref:README.md',
			},
			sections: [
				{
					id: 'image-manipulation',
					title: 'Image Manipulation',
					parentId: null,
					depth: 1,
					order: 0,
					path: 'image-manipulation',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'svgomg',
					sectionId: 'image-manipulation',
					title: 'SVGOMG',
					url: 'https://jakearchibald.github.io/svgomg/',
					description: 'SVG optimization tool',
					descriptionHtml: null,
					order: 0,
					tags: ['svg', 'optimizer'],
				},
				{
					id: 'svg-optimizer',
					sectionId: 'image-manipulation',
					title: 'SVG Optimizer',
					url: 'https://svgoptimizer.com/',
					description: 'Online SVG optimizer',
					descriptionHtml: null,
					order: 1,
					tags: ['svg', 'web'],
				},
			],
		};

		const index = buildIndex(domain);

		expect(index.schemaVersion).toBe(1);
		expect(index.docs).toHaveProperty('svgomg');
		expect(index.docs).toHaveProperty('svg-optimizer');

		// 'svg' should appear in both documents
		expect(index.terms.svg).toHaveLength(2);
		const svgPosting = index.terms.svg;
		expect(svgPosting.some((p) => p.id === 'svgomg')).toBe(true);
		expect(svgPosting.some((p) => p.id === 'svg-optimizer')).toBe(true);

		// 'optimizer' should appear in both documents
		expect(index.terms.optimizer).toHaveLength(2);
	});

	it('should parse GitHub source format into structured meta fields', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T00:00:00.000Z',
				source: 'github:teles/awesome-click-and-use@main:README.md',
			},
			sections: [],
			items: [],
		};

		const index = buildIndex(domain);

		expect(index.meta.repo).toBe('teles/awesome-click-and-use');
		expect(index.meta.ref).toBe('main');
		expect(index.meta.path).toBe('README.md');
		expect(index.meta.source).toBeUndefined();
	});

	it('should keep source field for non-GitHub formats', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T00:00:00.000Z',
				source: 'local:path/to/file.md',
			},
			sections: [],
			items: [],
		};

		const index = buildIndex(domain);

		expect(index.meta.source).toBe('local:path/to/file.md');
		expect(index.meta.repo).toBeUndefined();
		expect(index.meta.ref).toBeUndefined();
		expect(index.meta.path).toBeUndefined();
	});

	it('should include stats with document and term counts', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T00:00:00.000Z',
				source: 'test',
			},
			sections: [
				{
					id: 'tools',
					title: 'Tools',
					parentId: null,
					depth: 1,
					order: 0,
					path: 'tools',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'tool-one',
					sectionId: 'tools',
					title: 'Tool One',
					url: 'https://example.com',
					description: 'First tool',
					descriptionHtml: null,
					order: 0,
					tags: ['test'],
				},
				{
					id: 'tool-two',
					sectionId: 'tools',
					title: 'Tool Two',
					url: 'https://example.com',
					description: 'Second tool',
					descriptionHtml: null,
					order: 1,
					tags: ['test'],
				},
			],
		};

		const index = buildIndex(domain);

		expect(index.stats).toBeDefined();
		expect(index.stats?.docs).toBe(2);
		expect(index.stats?.terms).toBeGreaterThan(0);
		// Should have terms like: 'tool', 'one', 'two', 'first', 'second', 'test'
	});
});
