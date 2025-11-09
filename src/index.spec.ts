/**
 * Simple smoke test to verify the public API exports
 */
import { describe, it, expect } from 'vitest';
import {
	parse,
	generateDomainV1JsonSchema,
	generateBookmarksHtml,
	buildIndex,
} from './index';
import type {
	DomainV1,
	SectionV1,
	ItemV1,
	ParseOptions,
	SourceSpec,
	OutputTarget,
	Artifact,
	ParseResultFile,
	SearchIndex,
} from './index';

describe('Public API exports', () => {
	it('should export main functions', () => {
		expect(typeof parse).toBe('function');
		expect(typeof generateDomainV1JsonSchema).toBe('function');
		expect(typeof generateBookmarksHtml).toBe('function');
		expect(typeof buildIndex).toBe('function');
	});

	it('should export generateDomainV1JsonSchema that returns a schema', () => {
		const schema = generateDomainV1JsonSchema();
		expect(schema).toBeDefined();
		expect(typeof schema).toBe('object');
	});

	it('should export type guards work correctly', () => {
		// This is a compile-time test - if it compiles, the types are exported correctly
		const artifact: Artifact = 'domain';
		expect(['domain', 'index', 'bookmarks', 'sitemap', 'rss-json', 'rss-xml']).toContain(artifact);

		const section: SectionV1 = {
			id: 'test',
			title: 'Test',
			parentId: null,
			depth: 1,
			order: 0,
			path: 'test',
			descriptionHtml: null,
		};
		expect(section).toBeDefined();

		const item: ItemV1 = {
			id: 'item1',
			sectionId: 'test',
			title: 'Test Item',
			url: 'https://example.com',
			description: null,
			descriptionHtml: null,
			order: 0,
			tags: [],
		};
		expect(item).toBeDefined();
	});

	it('should export ParseOptions type that can be used', () => {
		const options: ParseOptions = {
			sources: [
				{
					from: 'test.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		};
		expect(options.sources).toHaveLength(1);
	});
});
