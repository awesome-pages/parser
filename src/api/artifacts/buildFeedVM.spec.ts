import { describe, expect, it } from 'vitest';
import type { DomainV1 } from '@/schemas/v1/domain.v1';
import { buildFeedVM } from './buildFeedVM';

describe('buildFeedVM', () => {
	it('should extract basic feed metadata from domain', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Awesome Tools',
				description: 'A curated list of awesome tools',
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'github://user/repo@main:README.md',
			},
			sections: [],
			items: [],
		};

		const feed = buildFeedVM(domain);

		expect(feed.title).toBe('Awesome Tools');
		expect(feed.description).toBe('A curated list of awesome tools');
		expect(feed.homePageUrl).toBe('https://github.com/user/repo');
		expect(feed.generatedAt).toBe('2025-11-08T12:00:00.000Z');
		expect(feed.items).toEqual([]);
	});

	it('should use default title when meta.title is not provided', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'test.md',
			},
			sections: [],
			items: [],
		};

		const feed = buildFeedVM(domain);

		expect(feed.title).toBe('Awesome List');
	});

	it('should collect items with URLs from all sections', () => {
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
			items: [
				{
					id: 'github',
					sectionId: 'tools',
					title: 'GitHub',
					url: 'https://github.com',
					description: 'Code hosting',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
				{
					id: 'mdn',
					sectionId: 'resources',
					title: 'MDN',
					url: 'https://developer.mozilla.org',
					description: 'Web docs',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const feed = buildFeedVM(domain);

		expect(feed.items).toHaveLength(2);
		expect(feed.items[0]).toEqual({
			id: 'github',
			url: 'https://github.com',
			title: 'GitHub',
			description: 'Code hosting',
			publishedAt: '2025-11-08T12:00:00.000Z',
		});
		expect(feed.items[1]).toEqual({
			id: 'mdn',
			url: 'https://developer.mozilla.org',
			title: 'MDN',
			description: 'Web docs',
			publishedAt: '2025-11-08T12:00:00.000Z',
		});
	});

	it('should skip items without URLs', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test Feed',
				generatedAt: '2025-11-08T12:00:00.000Z',
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
					description: 'Just a note',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
				{
					id: 'github',
					sectionId: 'notes',
					title: 'GitHub',
					url: 'https://github.com',
					description: null,
					descriptionHtml: null,
					order: 1,
					tags: [],
				},
			],
		};

		const feed = buildFeedVM(domain);

		expect(feed.items).toHaveLength(1);
		expect(feed.items[0].id).toBe('github');
	});

	it('should extract GitHub home page URL from source', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'github:teles/awesome-click-and-use@main:README.md',
			},
			sections: [],
			items: [],
		};

		const feed = buildFeedVM(domain);

		expect(feed.homePageUrl).toBe(
			'https://github.com/teles/awesome-click-and-use',
		);
	});

	it('should extract GitHub home page URL from source with slashes', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'github://teles/awesome-click-and-use@main:README.md',
			},
			sections: [],
			items: [],
		};

		const feed = buildFeedVM(domain);

		expect(feed.homePageUrl).toBe(
			'https://github.com/teles/awesome-click-and-use',
		);
	});

	it('should handle HTTP URLs as home page', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'https://example.com/readme.md',
			},
			sections: [],
			items: [],
		};

		const feed = buildFeedVM(domain);

		expect(feed.homePageUrl).toBe('https://example.com/readme.md');
	});

	it('should return null for home page URL when source is not parseable', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T12:00:00.000Z',
				source: 'local-file.md',
			},
			sections: [],
			items: [],
		};

		const feed = buildFeedVM(domain);

		expect(feed.homePageUrl).toBeNull();
	});

	it('should handle items with null descriptions', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
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

		const feed = buildFeedVM(domain);

		expect(feed.items[0].description).toBeNull();
	});
});
