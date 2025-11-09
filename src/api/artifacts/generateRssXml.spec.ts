import { describe, expect, it } from 'vitest';
import type { DomainV1 } from '@/schemas/v1/domain.v1';
import { generateRssXml } from './generateRssXml';

describe('generateRssXml', () => {
	it('should generate valid RSS 2.0 XML structure', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Awesome Tools',
				description: 'A curated list',
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'github://user/repo@main:README.md',
			},
			sections: [],
			items: [],
		};

		const xml = generateRssXml(domain);

		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<rss version="2.0">');
		expect(xml).toContain('<channel>');
		expect(xml).toContain('<title>Awesome Tools</title>');
		expect(xml).toContain('<description>A curated list</description>');
		expect(xml).toContain('<link>https://github.com/user/repo</link>');
		expect(xml).toContain('</channel>');
		expect(xml).toContain('</rss>');
	});

	it('should include lastBuildDate in RFC 822 format', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test',
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'test.md',
			},
			sections: [],
			items: [],
		};

		const xml = generateRssXml(domain);

		expect(xml).toContain(
			'<lastBuildDate>Sat, 08 Nov 2025 12:00:00 GMT</lastBuildDate>',
		);
	});

	it('should generate items with all required fields', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test Feed',
				generatedAt: '2025-11-08T12:00:00.000Z',
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
			],
		};

		const xml = generateRssXml(domain);

		expect(xml).toContain('<item>');
		expect(xml).toContain('<title>GitHub</title>');
		expect(xml).toContain('<link>https://github.com</link>');
		expect(xml).toContain('<guid isPermaLink="false">github</guid>');
		expect(xml).toContain('<description>Code hosting platform</description>');
		expect(xml).toContain('<pubDate>Sat, 08 Nov 2025 12:00:00 GMT</pubDate>');
		expect(xml).toContain('</item>');
	});

	it('should skip description element when item has no description', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test',
				generatedAt: '2025-11-08T12:00:00.000Z',
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
					id: 'item1',
					sectionId: 'section',
					title: 'Item 1',
					url: 'https://example.com',
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const xml = generateRssXml(domain);

		// Should not have a description tag for this item
		const itemSection = xml.substring(
			xml.indexOf('<item>'),
			xml.indexOf('</item>') + 7,
		);
		expect(itemSection).not.toContain('<description>');
	});

	it('should escape XML special characters', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test & <Special> "Characters"',
				description: 'Description with & < > " \' characters',
				generatedAt: '2025-11-08T12:00:00.000Z',
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
					title: 'Item & <Tag>',
					url: 'https://example.com?foo=bar&baz=qux',
					description: 'Test & "quotes" <tags>',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const xml = generateRssXml(domain);

		expect(xml).toContain('&amp;');
		expect(xml).toContain('&lt;');
		expect(xml).toContain('&gt;');
		expect(xml).toContain('&quot;');
		expect(xml).toContain('&apos;');
		expect(xml).not.toContain('Test & "quotes" <tags>');
	});

	it('should skip items without URLs', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test',
				generatedAt: '2025-11-08T12:00:00.000Z',
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
					id: 'note',
					sectionId: 'section',
					title: 'Note',
					url: undefined,
					description: 'Just a note',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
				{
					id: 'link',
					sectionId: 'section',
					title: 'Link',
					url: 'https://example.com',
					description: null,
					descriptionHtml: null,
					order: 1,
					tags: [],
				},
			],
		};

		const xml = generateRssXml(domain);

		expect(xml.match(/<item>/g)?.length).toBe(1);
		expect(xml).toContain('<title>Link</title>');
		expect(xml).not.toContain('<title>Note</title>');
	});

	it('should include generator tag', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test',
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'test.md',
			},
			sections: [],
			items: [],
		};

		const xml = generateRssXml(domain);

		expect(xml).toContain('<generator>awesome-pages/parser</generator>');
	});

	it('should handle multiple items', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test',
				generatedAt: '2025-11-08T12:00:00.000Z',
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
					id: 'item1',
					sectionId: 'section',
					title: 'Item 1',
					url: 'https://example.com/1',
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
				{
					id: 'item2',
					sectionId: 'section',
					title: 'Item 2',
					url: 'https://example.com/2',
					description: null,
					descriptionHtml: null,
					order: 1,
					tags: [],
				},
			],
		};

		const xml = generateRssXml(domain);

		expect(xml.match(/<item>/g)?.length).toBe(2);
		expect(xml).toContain('<title>Item 1</title>');
		expect(xml).toContain('<title>Item 2</title>');
	});

	it('should handle real-world example', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Awesome Click and Use',
				description:
					'Useful and awesome online tools that I often use. No download, no signup required.',
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'github://teles/awesome-click-and-use@main:README.md',
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
			],
			items: [
				{
					id: 'chatgpt',
					sectionId: 'ai',
					title: 'ChatGPT',
					url: 'https://chat.openai.com/chat',
					description: 'Dialogue optimized model',
					descriptionHtml: null,
					order: 0,
					tags: ['ai', 'llm'],
				},
			],
		};

		const xml = generateRssXml(domain);

		expect(xml).toContain('<title>Awesome Click and Use</title>');
		expect(xml).toContain(
			'<link>https://github.com/teles/awesome-click-and-use</link>',
		);
		expect(xml).toContain(
			'<description>Useful and awesome online tools that I often use. No download, no signup required.</description>',
		);
		expect(xml).toContain('<title>ChatGPT</title>');
		expect(xml).toContain('<link>https://chat.openai.com/chat</link>');
		expect(xml).toContain(
			'<description>Dialogue optimized model</description>',
		);
	});

	it('should handle empty channel values gracefully', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'local-file.md',
			},
			sections: [],
			items: [],
		};

		const xml = generateRssXml(domain);

		expect(xml).toContain('<title>Awesome List</title>');
		expect(xml).toContain('<link></link>');
		expect(xml).toContain('<description></description>');
	});
});
