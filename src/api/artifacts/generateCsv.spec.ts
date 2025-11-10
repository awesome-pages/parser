import { describe, expect, it } from 'vitest';
import type { DomainV1 } from '@/schemas/v1/domain.v1';
import { generateCsv } from './generateCsv';

describe('generateCsv', () => {
	it('should generate valid CSV with header and empty data', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Empty List',
				generatedAt: '2025-11-10T12:00:00.000Z',
				source: 'test.md',
			},
			sections: [],
			items: [],
		};

		const csv = generateCsv(domain);

		expect(csv).toBe('id,title,url,sectionId,sectionTitle,description,tags\n');
	});

	it('should generate CSV with single simple item', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test List',
				generatedAt: '2025-11-10T12:00:00.000Z',
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
					tags: ['git', 'code'],
				},
			],
		};

		const csv = generateCsv(domain);
		const lines = csv.split('\n');

		expect(lines[0]).toBe(
			'id,title,url,sectionId,sectionTitle,description,tags',
		);
		expect(lines[1]).toBe(
			'github,GitHub,https://github.com,tools,Tools,Code hosting platform,git|code',
		);
	});

	it('should generate CSV with multiple items and sections', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test List',
				generatedAt: '2025-11-10T12:00:00.000Z',
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
					id: 'libraries',
					title: 'Libraries',
					parentId: null,
					depth: 0,
					order: 1,
					path: 'libraries',
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
					tags: ['git'],
				},
				{
					id: 'react',
					sectionId: 'libraries',
					title: 'React',
					url: 'https://react.dev',
					description: 'UI library',
					descriptionHtml: null,
					order: 0,
					tags: ['ui', 'frontend'],
				},
			],
		};

		const csv = generateCsv(domain);
		const lines = csv.split('\n');

		expect(lines).toHaveLength(4); // header + 2 items + trailing newline
		expect(lines[1]).toBe(
			'github,GitHub,https://github.com,tools,Tools,Code hosting,git',
		);
		expect(lines[2]).toBe(
			'react,React,https://react.dev,libraries,Libraries,UI library,ui|frontend',
		);
	});

	it('should properly escape commas in fields', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test List',
				generatedAt: '2025-11-10T12:00:00.000Z',
				source: 'test.md',
			},
			sections: [
				{
					id: 'tools',
					title: 'Tools, Utilities',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'tools',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'tool1',
					sectionId: 'tools',
					title: 'Tool, Best One',
					url: 'https://example.com',
					description: 'A tool for parsing, editing, and more',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const csv = generateCsv(domain);
		const lines = csv.split('\n');

		expect(lines[1]).toBe(
			'tool1,"Tool, Best One",https://example.com,tools,"Tools, Utilities","A tool for parsing, editing, and more",',
		);
	});

	it('should properly escape double quotes in fields', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test List',
				generatedAt: '2025-11-10T12:00:00.000Z',
				source: 'test.md',
			},
			sections: [
				{
					id: 'tools',
					title: 'The "Best" Tools',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'tools',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'tool1',
					sectionId: 'tools',
					title: 'My "Favorite" Tool',
					url: 'https://example.com',
					description: 'Described as "awesome"',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const csv = generateCsv(domain);
		const lines = csv.split('\n');

		expect(lines[1]).toBe(
			'tool1,"My ""Favorite"" Tool",https://example.com,tools,"The ""Best"" Tools","Described as ""awesome""",',
		);
	});

	it('should properly escape newlines in fields', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test List',
				generatedAt: '2025-11-10T12:00:00.000Z',
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
					id: 'tool1',
					sectionId: 'tools',
					title: 'Multi\nLine\nTitle',
					url: 'https://example.com',
					description: 'Line 1\nLine 2\nLine 3',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const csv = generateCsv(domain);

		// The newlines in the field should be preserved inside quotes
		expect(csv).toContain('"Multi\nLine\nTitle"');
		expect(csv).toContain('"Line 1\nLine 2\nLine 3"');
	});

	it('should handle missing optional fields', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test List',
				generatedAt: '2025-11-10T12:00:00.000Z',
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
					id: 'tool1',
					sectionId: 'tools',
					title: 'Tool Without URL',
					url: undefined,
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const csv = generateCsv(domain);
		const lines = csv.split('\n');

		expect(lines[1]).toBe('tool1,Tool Without URL,,tools,Tools,,');
	});

	it('should handle items with multiple tags', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test List',
				generatedAt: '2025-11-10T12:00:00.000Z',
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
					id: 'tool1',
					sectionId: 'tools',
					title: 'Multi-tag Tool',
					url: 'https://example.com',
					description: 'Has many tags',
					descriptionHtml: null,
					order: 0,
					tags: ['javascript', 'typescript', 'nodejs', 'web'],
				},
			],
		};

		const csv = generateCsv(domain);
		const lines = csv.split('\n');

		expect(lines[1]).toBe(
			'tool1,Multi-tag Tool,https://example.com,tools,Tools,Has many tags,javascript|typescript|nodejs|web',
		);
	});

	it('should handle section not found gracefully', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Test List',
				generatedAt: '2025-11-10T12:00:00.000Z',
				source: 'test.md',
			},
			sections: [],
			items: [
				{
					id: 'orphan',
					sectionId: 'nonexistent',
					title: 'Orphaned Item',
					url: 'https://example.com',
					description: 'Item without section',
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const csv = generateCsv(domain);
		const lines = csv.split('\n');

		expect(lines[1]).toBe(
			'orphan,Orphaned Item,https://example.com,nonexistent,,Item without section,',
		);
	});

	it('should match the example from requirements', () => {
		const domain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				title: 'Awesome Tools',
				generatedAt: '2025-11-10T12:00:00.000Z',
				source: 'test.md',
			},
			sections: [
				{
					id: 'image-manipulation',
					title: 'Image Manipulation',
					parentId: null,
					depth: 0,
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
					description: 'Image manipulation tool',
					descriptionHtml: null,
					order: 0,
					tags: ['svg', 'optimization'],
				},
			],
		};

		const csv = generateCsv(domain);
		const lines = csv.split('\n');

		expect(lines[0]).toBe(
			'id,title,url,sectionId,sectionTitle,description,tags',
		);
		expect(lines[1]).toBe(
			'svgomg,SVGOMG,https://jakearchibald.github.io/svgomg/,image-manipulation,Image Manipulation,Image manipulation tool,svg|optimization',
		);
	});
});
