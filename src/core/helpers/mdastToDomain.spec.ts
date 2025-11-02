import type { Root } from 'mdast';
import { describe, expect, it } from 'vitest';
import { mdastToDomain } from '@/core/mdastToDomain.js';

describe('mdastToDomain', () => {
	describe('metadata', () => {
		it('should require source in options', () => {
			const tree: Root = {
				type: 'root',
				children: [
					{
						type: 'heading',
						depth: 2,
						children: [{ type: 'text', value: 'Section' }],
					},
				],
			};

			const domain = mdastToDomain(tree, {
				title: 'Test Title',
				description: 'Test Description',
				source: 'local:/path/to/file.md',
			});

			expect(domain.meta.source).toBe('local:/path/to/file.md');
			expect(domain.meta.title).toBe('Test Title');
			expect(domain.meta.description).toBe('Test Description');
		});

		it('should include source from URL', () => {
			const tree: Root = {
				type: 'root',
				children: [],
			};

			const domain = mdastToDomain(tree, {
				source: 'http:https://example.com/readme.md',
			});

			expect(domain.meta.source).toBe('http:https://example.com/readme.md');
		});

		it('should include source from GitHub', () => {
			const tree: Root = {
				type: 'root',
				children: [],
			};

			const domain = mdastToDomain(tree, {
				source: 'github:owner/repo@main:README.md',
			});

			expect(domain.meta.source).toBe('github:owner/repo@main:README.md');
		});

		it('should respect frontmatter for title and description', () => {
			const tree: Root = {
				type: 'root',
				children: [
					{
						type: 'heading',
						depth: 2,
						children: [{ type: 'text', value: 'Section' }],
					},
				],
			};

			const domain = mdastToDomain(tree, {
				title: 'Frontmatter Title',
				description: 'Frontmatter Description',
				source: 'local:/test.md',
				frontmatter: {
					title: 'Frontmatter Title',
					description: 'Frontmatter Description',
					author: 'John Doe',
				},
			});

			expect(domain.meta.title).toBe('Frontmatter Title');
			expect(domain.meta.description).toBe('Frontmatter Description');
			expect(domain.meta.frontmatter).toEqual({
				title: 'Frontmatter Title',
				description: 'Frontmatter Description',
				author: 'John Doe',
			});
			expect(domain.meta.source).toBe('local:/test.md');
		});

		it('should handle missing title and description with source still present', () => {
			const tree: Root = {
				type: 'root',
				children: [
					{
						type: 'heading',
						depth: 2,
						children: [{ type: 'text', value: 'Section' }],
					},
				],
			};

			const domain = mdastToDomain(tree, {
				source: 'local:/empty.md',
			});

			expect(domain.meta.source).toBe('local:/empty.md');
			expect(domain.meta.title).toBeUndefined();
			expect(domain.meta.description).toBeUndefined();
		});
	});

	describe('sections and items parsing', () => {
		it('should parse sections from headings', () => {
			const tree: Root = {
				type: 'root',
				children: [
					{
						type: 'heading',
						depth: 2,
						children: [{ type: 'text', value: 'First Section' }],
					},
					{
						type: 'heading',
						depth: 2,
						children: [{ type: 'text', value: 'Second Section' }],
					},
				],
			};

			const domain = mdastToDomain(tree, {
				source: 'local:/test.md',
			});

			expect(domain.sections).toHaveLength(2);
			expect(domain.sections[0].title).toBe('First Section');
			expect(domain.sections[1].title).toBe('Second Section');
			expect(domain.meta.source).toBe('local:/test.md');
		});

		it('should parse items from list items with links', () => {
			const tree: Root = {
				type: 'root',
				children: [
					{
						type: 'heading',
						depth: 2,
						children: [{ type: 'text', value: 'Tools' }],
					},
					{
						type: 'list',
						ordered: false,
						children: [
							{
								type: 'listItem',
								children: [
									{
										type: 'paragraph',
										children: [
											{
												type: 'link',
												url: 'https://example.com',
												children: [{ type: 'text', value: 'Example' }],
											},
											{ type: 'text', value: ' - A sample tool' },
										],
									},
								],
							},
						],
					},
				],
			};

			const domain = mdastToDomain(tree, {
				title: 'My List',
				source: 'local:/test.md',
			});

			expect(domain.items).toHaveLength(1);
			expect(domain.items[0].title).toBe('Example');
			expect(domain.items[0].url).toBe('https://example.com');
			expect(domain.items[0].description).toBe('A sample tool');
			expect(domain.meta.source).toBe('local:/test.md');
		});
	});

	describe('generatedAt timestamp', () => {
		it('should use provided generatedAt if specified', () => {
			const tree: Root = {
				type: 'root',
				children: [],
			};

			const customDate = '2024-01-01T00:00:00.000Z';
			const domain = mdastToDomain(tree, {
				source: 'local:/test.md',
				generatedAt: customDate,
			});

			expect(domain.meta.generatedAt).toBe(customDate);
		});

		it('should generate timestamp if not provided', () => {
			const tree: Root = {
				type: 'root',
				children: [],
			};

			const beforeTime = new Date().toISOString();
			const domain = mdastToDomain(tree, {
				source: 'local:/test.md',
			});
			const afterTime = new Date().toISOString();

			expect(domain.meta.generatedAt).toBeDefined();
			expect(domain.meta.generatedAt >= beforeTime).toBe(true);
			expect(domain.meta.generatedAt <= afterTime).toBe(true);
		});
	});
});
