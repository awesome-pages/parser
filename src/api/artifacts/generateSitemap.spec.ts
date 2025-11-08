import { describe, expect, it } from 'vitest';
import type { DomainV1 } from '@/schemas/v1/domain.v1';
import { generateSitemap } from './generateSitemap';

describe('generateSitemap', () => {
	it('should generate valid XML sitemap with header', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-01-15T12:00:00.000Z',
				source: 'test.md',
			},
			sections: [],
			items: [],
		};

		const xml = generateSitemap(domain);

		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml).toContain('</urlset>');
	});

	it('should include items with valid URLs', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-01-15T12:00:00.000Z',
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
					description: 'Code hosting',
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

		const xml = generateSitemap(domain);

		expect(xml).toContain('<loc>https://github.com</loc>');
		expect(xml).toContain('<loc>https://gitlab.com</loc>');
		expect(xml).toContain('<lastmod>2025-01-15</lastmod>');
	});

	it('should skip items without URLs', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-01-15T12:00:00.000Z',
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

		const xml = generateSitemap(domain);

		expect(xml).not.toContain('Important Note');
		expect(xml).toContain('<loc>https://github.com</loc>');
	});

	it('should escape XML special characters in URLs', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-01-15T12:00:00.000Z',
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
					url: 'https://example.com/search?q=test&lang=en&format=xml',
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const xml = generateSitemap(domain);

		expect(xml).toContain('q=test&amp;lang=en&amp;format=xml');
		expect(xml).not.toContain('q=test&lang=en');
	});

	it('should include standard sitemap fields', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-01-15T12:00:00.000Z',
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

		const xml = generateSitemap(domain);

		expect(xml).toContain('<url>');
		expect(xml).toContain('<loc>');
		expect(xml).toContain('<lastmod>');
		expect(xml).toContain('<changefreq>weekly</changefreq>');
		expect(xml).toContain('<priority>0.5</priority>');
		expect(xml).toContain('</url>');
	});

	it('should handle multiple sections with items', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-01-15T12:00:00.000Z',
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
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
				{
					id: 'mdn',
					sectionId: 'resources',
					title: 'MDN',
					url: 'https://developer.mozilla.org',
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const xml = generateSitemap(domain);

		expect(xml).toContain('<loc>https://github.com</loc>');
		expect(xml).toContain('<loc>https://developer.mozilla.org</loc>');
		expect(xml.match(/<url>/g)?.length).toBe(2);
	});

	it('should format date correctly from ISO timestamp', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-11-08T15:30:45.123Z',
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

		const xml = generateSitemap(domain);

		expect(xml).toContain('<lastmod>2025-11-08</lastmod>');
	});

	it('should handle empty sections', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: '2025-01-15T12:00:00.000Z',
				source: 'test.md',
			},
			sections: [
				{
					id: 'empty',
					title: 'Empty Section',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'empty',
					descriptionHtml: null,
				},
			],
			items: [],
		};

		const xml = generateSitemap(domain);

		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<urlset');
		expect(xml).toContain('</urlset>');
		expect(xml).not.toContain('<url>');
	});
});
