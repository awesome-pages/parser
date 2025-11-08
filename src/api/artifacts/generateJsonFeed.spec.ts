import { describe, expect, it } from 'vitest';
import type { DomainV1 } from '@/schemas/v1/domain.v1';
import { generateJsonFeed } from './generateJsonFeed';

describe('generateJsonFeed', () => {
	it('should generate valid JSON Feed v1.1 structure', () => {
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

		const output = generateJsonFeed(domain);
		const feed = JSON.parse(output);

		expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
		expect(feed.title).toBe('Awesome Tools');
		expect(feed.description).toBe('A curated list');
		expect(feed.home_page_url).toBe('https://github.com/user/repo');
		expect(feed.items).toEqual([]);
	});

	it('should include feed_url when provided', () => {
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

		const output = generateJsonFeed(
			domain,
			'https://example.com/feed.json',
		);
		const feed = JSON.parse(output);

		expect(feed.feed_url).toBe('https://example.com/feed.json');
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

		const output = generateJsonFeed(domain);
		const feed = JSON.parse(output);

		expect(feed.items).toHaveLength(2);

		expect(feed.items[0]).toEqual({
			id: 'github',
			url: 'https://github.com',
			title: 'GitHub',
			content_text: 'Code hosting platform',
			date_published: '2025-11-08T12:00:00.000Z',
		});

		expect(feed.items[1]).toEqual({
			id: 'gitlab',
			url: 'https://gitlab.com',
			title: 'GitLab',
			date_published: '2025-11-08T12:00:00.000Z',
		});
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

		const output = generateJsonFeed(domain);
		const feed = JSON.parse(output);

		expect(feed.items).toHaveLength(1);
		expect(feed.items[0].id).toBe('link');
	});

	it('should not include optional fields when not available', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'local-file.md',
			},
			sections: [],
			items: [],
		};

		const output = generateJsonFeed(domain);
		const feed = JSON.parse(output);

		expect(feed.home_page_url).toBeUndefined();
		expect(feed.description).toBeUndefined();
		expect(feed.feed_url).toBeUndefined();
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

		const output = generateJsonFeed(domain);
		const feed = JSON.parse(output);

		expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
		expect(feed.title).toBe('Awesome Click and Use');
		expect(feed.description).toBe(
			'Useful and awesome online tools that I often use. No download, no signup required.',
		);
		expect(feed.home_page_url).toBe(
			'https://github.com/teles/awesome-click-and-use',
		);
		expect(feed.items).toHaveLength(1);
		expect(feed.items[0].id).toBe('chatgpt');
		expect(feed.items[0].title).toBe('ChatGPT');
		expect(feed.items[0].content_text).toBe('Dialogue optimized model');
	});

	it('should produce valid JSON output', () => {
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

		const output = generateJsonFeed(domain);

		// Should be valid JSON
		expect(() => JSON.parse(output)).not.toThrow();

		// Should be formatted with 2-space indentation
		expect(output).toContain('  "version"');
	});
});
