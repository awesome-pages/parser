import { describe, it, expect } from 'vitest';
import { buildIndex } from '@/core/helpers/buildIndex';
import type { DomainV1 } from '@/schemas/v1/domain.v1';

describe('buildIndex integration', () => {
	it('should create a complete search index from a realistic domain', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Awesome Click and Use',
				description: 'Useful and awesome online tools',
				generatedAt: '2025-11-08T00:00:00.000Z',
				source: 'github:owner/repo@main:README.md',
			},
			sections: [
				{
					id: 'ai',
					title: 'AI',
					parentId: null,
					depth: 1,
					order: 0,
					path: 'ai',
					descriptionHtml: null,
				},
				{
					id: 'design',
					title: 'Design',
					parentId: null,
					depth: 1,
					order: 1,
					path: 'design',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'chatgpt',
					sectionId: 'ai',
					title: 'ChatGPT',
					url: 'https://chat.openai.com/',
					description: 'Conversational model',
					descriptionHtml: null,
					order: 0,
					tags: ['ai', 'llm'],
				},
				{
					id: 'claude',
					sectionId: 'ai',
					title: 'Claude',
					url: 'https://claude.ai/',
					description: 'AI assistant by Anthropic',
					descriptionHtml: null,
					order: 1,
					tags: ['ai'],
				},
				{
					id: 'figma',
					sectionId: 'design',
					title: 'Figma',
					url: 'https://www.figma.com/',
					description: 'Collaborative design tool',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
				{
					id: 'canva',
					sectionId: 'design',
					title: 'Canva',
					url: 'https://www.canva.com/',
					description: 'Easy graphic design',
					descriptionHtml: null,
					order: 1,
					tags: [],
				},
			],
		};

		const index = buildIndex(domain);

		// Verify schema and meta
		expect(index.schemaVersion).toBe(1);
		expect(index.meta.source).toBe('github:owner/repo@main:README.md');
		expect(index.meta.generatedAt).toBe('2025-11-08T00:00:00.000Z');
		expect(index.meta.fieldWeights).toEqual({
			title: 2,
			description: 1,
			tags: 1.5,
		});

		// Verify docs map
		expect(Object.keys(index.docs)).toHaveLength(4);
		expect(index.docs.chatgpt).toEqual({
			title: 'ChatGPT',
			url: 'https://chat.openai.com/',
			sectionId: 'ai',
		});
		expect(index.docs.claude).toEqual({
			title: 'Claude',
			url: 'https://claude.ai/',
			sectionId: 'ai',
		});
		expect(index.docs.figma).toEqual({
			title: 'Figma',
			url: 'https://www.figma.com/',
			sectionId: 'design',
		});
		expect(index.docs.canva).toEqual({
			title: 'Canva',
			url: 'https://www.canva.com/',
			sectionId: 'design',
		});

		// Verify term indexing
		// 'ai' appears in tags for chatgpt (1.5) and claude (1.5), and in claude description (1)
		expect(index.terms.ai).toBeDefined();
		expect(index.terms.ai.length).toBe(2);
		const aiPostings = index.terms.ai;
		const claudePosting = aiPostings.find((p) => p.id === 'claude');
		const chatgptPosting = aiPostings.find((p) => p.id === 'chatgpt');
		expect(claudePosting?.f).toBe(2.5); // tags: 1.5, description: 1
		expect(chatgptPosting?.f).toBe(1.5); // tags: 1.5

		// 'llm' appears in chatgpt tags
		expect(index.terms.llm).toEqual([{ id: 'chatgpt', f: 1.5 }]);

		// 'design' appears in figma description, canva description
		expect(index.terms.design).toBeDefined();
		expect(index.terms.design.length).toBe(2);

		// Verify tokens are lowercase
		expect(index.terms.chatgpt).toBeDefined();
		expect(index.terms.ChatGPT).toBeUndefined();

		// Verify stopwords are removed
		expect(index.terms.by).toBeUndefined(); // "by Anthropic"

		// Verify postings are sorted by frequency
		const designPostings = index.terms.design;
		// Both should have same frequency (1 from description)
		expect(designPostings[0].f).toBeGreaterThanOrEqual(designPostings[1].f);
	});

	it('should handle search query simulation', () => {
		// This demonstrates how a client would use the index
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
					id: 'svg-editor',
					sectionId: 'tools',
					title: 'SVG Editor',
					url: 'https://example.com/svg-editor',
					description: 'Edit SVG files online',
					descriptionHtml: null,
					order: 0,
					tags: ['svg', 'editor'],
				},
				{
					id: 'image-optimizer',
					sectionId: 'tools',
					title: 'Image Optimizer',
					url: 'https://example.com/optimizer',
					description: 'Optimize images including SVG',
					descriptionHtml: null,
					order: 1,
					tags: ['optimization'],
				},
			],
		};

		const index = buildIndex(domain);

		// Simulate search for "svg"
		const svgResults = index.terms.svg || [];
		expect(svgResults.length).toBe(2);

		// Get document details for results
		const svgDocs = svgResults.map((r) => ({
			...index.docs[r.id],
			score: r.f,
		}));

		// svg-editor should rank higher (appears in title, description, and tags)
		const svgEditorScore = svgDocs.find((d) => d.title === 'SVG Editor')?.score;
		const imageOptimizerScore = svgDocs.find(
			(d) => d.title === 'Image Optimizer',
		)?.score;

		expect(svgEditorScore).toBeGreaterThan(imageOptimizerScore!);
	});

	it('should produce JSON that matches the spec format', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-04T00:09:41.335Z',
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
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
				{
					id: 'svg-optimizer',
					sectionId: 'image-manipulation',
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
		const json = JSON.parse(JSON.stringify(index));

		// Verify it matches the spec structure
		expect(json).toHaveProperty('schemaVersion');
		expect(json).toHaveProperty('meta');
		expect(json).toHaveProperty('docs');
		expect(json).toHaveProperty('terms');

		expect(json.meta).toHaveProperty('source');
		expect(json.meta).toHaveProperty('generatedAt');
		expect(json.meta).toHaveProperty('fieldWeights');

		expect(json.meta.fieldWeights).toHaveProperty('title');
		expect(json.meta.fieldWeights).toHaveProperty('description');
		expect(json.meta.fieldWeights).toHaveProperty('tags');

		// Verify docs structure
		for (const [id, doc] of Object.entries(json.docs)) {
			expect(typeof id).toBe('string');
			expect(doc).toHaveProperty('title');
			expect(doc).toHaveProperty('sectionId');
			// url is optional
		}

		// Verify terms structure
		for (const [term, postings] of Object.entries(json.terms)) {
			expect(typeof term).toBe('string');
			expect(Array.isArray(postings)).toBe(true);
			for (const posting of postings as any[]) {
				expect(posting).toHaveProperty('id');
				expect(posting).toHaveProperty('f');
				expect(typeof posting.id).toBe('string');
				expect(typeof posting.f).toBe('number');
			}
		}
	});
});
