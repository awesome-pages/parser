import { describe, expect, it } from 'vitest';
import type { DomainV1 } from '@/schemas/v1/domain.v1';
import { generateBookmarksHtml } from './generateBookmarksHtml';

describe('generateBookmarksHtml', () => {
	it('should generate valid Netscape Bookmark format header', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test Bookmarks',
				generatedAt: '2025-01-01T00:00:00.000Z',
				source: 'test.md',
			},
			sections: [],
			items: [],
		};

		const html = generateBookmarksHtml(domain);

		expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
		expect(html).toContain('DO NOT EDIT!');
		expect(html).toContain('<META HTTP-EQUIV="Content-Type"');
		expect(html).toContain('<TITLE>Test Bookmarks</TITLE>');
		expect(html).toContain('<H1>Test Bookmarks</H1>');
	});

	it('should use default title when meta.title is not provided', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-01-01T00:00:00.000Z',
				source: 'test.md',
			},
			sections: [],
			items: [],
		};

		const html = generateBookmarksHtml(domain);

		expect(html).toContain('<TITLE>Awesome List</TITLE>');
		expect(html).toContain('<H1>Awesome List</H1>');
	});

	it('should escape HTML entities in title', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test & <Bookmarks> "with" \'quotes\'',
				generatedAt: '2025-01-01T00:00:00.000Z',
				source: 'test.md',
			},
			sections: [],
			items: [],
		};

		const html = generateBookmarksHtml(domain);

		expect(html).toContain('&lt;Bookmarks&gt;');
		expect(html).toContain('&amp;');
		expect(html).toContain('&quot;');
		expect(html).toContain('&#39;');
	});

	it('should generate folders for sections', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'My List',
				generatedAt: '2025-01-01T00:00:00.000Z',
				source: 'test.md',
			},
			sections: [
				{
					id: 'tools',
					title: 'Tools',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'tools',
					descriptionHtml: null,
				},
				{
					id: 'resources',
					title: 'Resources',
					parentId: null,
					depth: 0,
					order: 1,
					path: 'resources',
					descriptionHtml: null,
				},
			],
			items: [],
		};

		const html = generateBookmarksHtml(domain);

		expect(html).toContain('<H3 ADD_DATE=');
		expect(html).toContain('>Tools</H3>');
		expect(html).toContain('>Resources</H3>');
	});

	it('should generate bookmarks for items', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'My List',
				generatedAt: '2025-01-01T00:00:00.000Z',
				source: 'test.md',
			},
			sections: [
				{
					id: 'tools',
					title: 'Tools',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'tools',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'github',
					sectionId: 'tools',
					title: 'GitHub',
					url: 'https://github.com',
					description: 'Code hosting platform',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
				{
					id: 'gitlab',
					sectionId: 'tools',
					title: 'GitLab',
					url: 'https://gitlab.com',
					description: null,
					descriptionHtml: null,
					order: 1,
					tags: [],
				},
			],
		};

		const html = generateBookmarksHtml(domain);

		expect(html).toContain('<A HREF="https://github.com"');
		expect(html).toContain('>GitHub</A>');
		expect(html).toContain(' - Code hosting platform');
		expect(html).toContain('<A HREF="https://gitlab.com"');
		expect(html).toContain('>GitLab</A>');
	});

	it('should handle items without URLs', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'My List',
				generatedAt: '2025-01-01T00:00:00.000Z',
				source: 'test.md',
			},
			sections: [
				{
					id: 'notes',
					title: 'Notes',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'notes',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'note1',
					sectionId: 'notes',
					title: 'Important Note',
					url: undefined,
					description: 'This is just a note',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const html = generateBookmarksHtml(domain);

		expect(html).toContain('<A HREF="#"');
		expect(html).toContain('>Important Note</A>');
	});

	it('should sort sections and items by order', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'My List',
				generatedAt: '2025-01-01T00:00:00.000Z',
				source: 'test.md',
			},
			sections: [
				{
					id: 'second',
					title: 'Second Section',
					parentId: null,
					depth: 0,
					order: 1,
					path: 'second',
					descriptionHtml: null,
				},
				{
					id: 'first',
					title: 'First Section',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'first',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'item2',
					sectionId: 'first',
					title: 'Item 2',
					url: 'https://example.com/2',
					description: null,
					descriptionHtml: null,
					order: 1,
					tags: [],
				},
				{
					id: 'item1',
					sectionId: 'first',
					title: 'Item 1',
					url: 'https://example.com/1',
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const html = generateBookmarksHtml(domain);

		const firstSectionIndex = html.indexOf('First Section');
		const secondSectionIndex = html.indexOf('Second Section');
		const item1Index = html.indexOf('Item 1');
		const item2Index = html.indexOf('Item 2');

		expect(firstSectionIndex).toBeLessThan(secondSectionIndex);
		expect(item1Index).toBeLessThan(item2Index);
	});

	it('should handle nested sections (hierarchical folders)', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'My List',
				generatedAt: '2025-01-01T00:00:00.000Z',
				source: 'test.md',
			},
			sections: [
				{
					id: 'parent',
					title: 'Parent',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'parent',
					descriptionHtml: null,
				},
				{
					id: 'child1',
					title: 'Child 1',
					parentId: 'parent',
					depth: 1,
					order: 0,
					path: 'parent/child1',
					descriptionHtml: null,
				},
				{
					id: 'child2',
					title: 'Child 2',
					parentId: 'parent',
					depth: 1,
					order: 1,
					path: 'parent/child2',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'item1',
					sectionId: 'child1',
					title: 'Item in Child 1',
					url: 'https://example.com/1',
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const html = generateBookmarksHtml(domain);

		expect(html).toContain('>Parent</H3>');
		expect(html).toContain('>Child 1</H3>');
		expect(html).toContain('>Child 2</H3>');
		expect(html).toContain('>Item in Child 1</A>');

		// Verify nesting structure exists
		const parentIndex = html.indexOf('>Parent</H3>');
		const child1Index = html.indexOf('>Child 1</H3>');
		const child2Index = html.indexOf('>Child 2</H3>');

		expect(parentIndex).toBeLessThan(child1Index);
		expect(child1Index).toBeLessThan(child2Index);
	});

	it('should escape HTML entities in item titles and descriptions', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'My List',
				generatedAt: '2025-01-01T00:00:00.000Z',
				source: 'test.md',
			},
			sections: [
				{
					id: 'section',
					title: 'Section',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'section',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'item',
					sectionId: 'section',
					title: '<script>alert("XSS")</script>',
					url: 'https://example.com?foo=bar&baz=qux',
					description: 'Test & "quotes" <tags>',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const html = generateBookmarksHtml(domain);

		expect(html).toContain('&lt;script&gt;');
		expect(html).toContain('&amp;');
		expect(html).toContain('&quot;');
		expect(html).not.toContain('<script>');
		expect(html).toContain('foo=bar&amp;baz=qux');
	});

	it('should include ADD_DATE attributes', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'My List',
				generatedAt: '2025-01-01T00:00:00.000Z',
				source: 'test.md',
			},
			sections: [
				{
					id: 'section',
					title: 'Section',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'section',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'item',
					sectionId: 'section',
					title: 'Item',
					url: 'https://example.com',
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const html = generateBookmarksHtml(domain);

		expect(html).toMatch(/ADD_DATE="\d+"/);
		expect(html.match(/ADD_DATE="\d+"/g)?.length).toBeGreaterThan(0);
	});

	it('should handle real-world example', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Awesome Click and Use',
				description: 'Useful and awesome online tools',
				generatedAt: '2025-01-01T00:00:00.000Z',
				source: 'awesome-click-and-use.md',
			},
			sections: [
				{
					id: 'ai',
					title: 'AI',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'ai',
					descriptionHtml: null,
				},
				{
					id: 'design',
					title: 'Design',
					parentId: null,
					depth: 0,
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
					descriptionHtml: '<p>Conversational model</p>',
					order: 0,
					tags: ['ai', 'llm'],
				},
				{
					id: 'figma',
					sectionId: 'design',
					title: 'Figma',
					url: 'https://www.figma.com/',
					description: 'Collaborative design tool',
					descriptionHtml: '<p>Collaborative design tool</p>',
					order: 0,
					tags: [],
				},
			],
		};

		const html = generateBookmarksHtml(domain);

		expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
		expect(html).toContain('Awesome Click and Use');
		expect(html).toContain('>AI</H3>');
		expect(html).toContain('>Design</H3>');
		expect(html).toContain('>ChatGPT</A>');
		expect(html).toContain('https://chat.openai.com/');
		expect(html).toContain(' - Conversational model');
		expect(html).toContain('>Figma</A>');
		expect(html).toContain('https://www.figma.com/');
	});
});
