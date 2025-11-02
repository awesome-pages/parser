import type { Root } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { describe, expect, it } from 'vitest';
import remarkAwesomePagesMarkers from '@/plugins/awesomePagesMarkers.js';

interface AwesomePagesData {
	awesomePages?: {
		hasExplicitBlocks?: boolean;
	};
}

describe('remarkAwesomePagesMarkers', () => {
	describe('without start/end markers', () => {
		it('should keep all content when no markers are present', async () => {
			const markdown = `# Hello

This is a paragraph.

## Section

Another paragraph.`;

			const processor = unified()
				.use(remarkParse)
				.use(remarkAwesomePagesMarkers);

			const tree = processor.parse(markdown) as Root;
			const vfile = new VFile({ value: markdown });
			const result = await processor.run(tree, vfile);

			expect(result.children).toHaveLength(4); // heading, paragraph, heading, paragraph
			expect(
				(vfile.data as { awesomePages?: { hasExplicitBlocks?: boolean } })
					.awesomePages?.hasExplicitBlocks,
			).toBe(false);
		});

		it('should filter out ignore blocks when no start/end markers', async () => {
			const markdown = `# Hello

This should be kept.

<!--awesome-pages:ignore:start-->
This should be ignored.
<!--awesome-pages:ignore:end-->

This should also be kept.`;

			const processor = unified()
				.use(remarkParse)
				.use(remarkAwesomePagesMarkers);

			const tree = processor.parse(markdown) as Root;
			const vfile = new VFile({ value: markdown });
			const result = await processor.run(tree, vfile);

			expect(result.children).toHaveLength(3); // heading + 2 paragraphs
			expect(
				(vfile.data as AwesomePagesData).awesomePages?.hasExplicitBlocks,
			).toBe(false);
		});

		it('should handle nested ignore blocks', async () => {
			const markdown = `# Hello

Keep this.

<!--awesome-pages:ignore:start-->
Ignore outer start.
<!--awesome-pages:ignore:start-->
Ignore nested.
<!--awesome-pages:ignore:end-->
Still ignored.
<!--awesome-pages:ignore:end-->

Keep this too.`;

			const processor = unified()
				.use(remarkParse)
				.use(remarkAwesomePagesMarkers);

			const tree = processor.parse(markdown) as Root;
			const vfile = new VFile({ value: markdown });
			const result = await processor.run(tree, vfile);

			expect(result.children).toHaveLength(3); // heading + 2 paragraphs
		});
	});

	describe('with start/end markers', () => {
		it('should only keep content between start/end markers', async () => {
			const markdown = `# Before

This should be filtered out.

<!--awesome-pages:start-->
## Inside

This should be kept.
<!--awesome-pages:end-->

This should be filtered out too.`;

			const processor = unified()
				.use(remarkParse)
				.use(remarkAwesomePagesMarkers);

			const tree = processor.parse(markdown) as Root;
			const vfile = new VFile({ value: markdown });
			const result = await processor.run(tree, vfile);

			expect(result.children).toHaveLength(2); // heading + paragraph
			expect(
				(vfile.data as AwesomePagesData).awesomePages?.hasExplicitBlocks,
			).toBe(true);
		});

		it('should support multiple start/end pairs', async () => {
			const markdown = `# Before

Filtered.

<!--awesome-pages:start-->
First block.
<!--awesome-pages:end-->

Also filtered.

<!--awesome-pages:start-->
Second block.
<!--awesome-pages:end-->

Filtered again.`;

			const processor = unified()
				.use(remarkParse)
				.use(remarkAwesomePagesMarkers);

			const tree = processor.parse(markdown) as Root;
			const vfile = new VFile({ value: markdown });
			const result = await processor.run(tree, vfile);

			expect(result.children).toHaveLength(2); // 2 paragraphs
		});

		it('should handle ignore blocks within start/end blocks', async () => {
			const markdown = `<!--awesome-pages:start-->
Keep this.

<!--awesome-pages:ignore:start-->
Ignore this.
<!--awesome-pages:ignore:end-->

Keep this too.
<!--awesome-pages:end-->`;

			const processor = unified()
				.use(remarkParse)
				.use(remarkAwesomePagesMarkers);

			const tree = processor.parse(markdown) as Root;
			const vfile = new VFile({ value: markdown });
			const result = await processor.run(tree, vfile);

			expect(result.children).toHaveLength(2); // 2 paragraphs (ignore block removed)
		});

		it('should filter all HTML comments including markers', async () => {
			const markdown = `<!--awesome-pages:start-->
Keep this content.
<!-- This is a regular comment -->
Keep this too.
<!--awesome-pages:end-->`;

			const processor = unified()
				.use(remarkParse)
				.use(remarkAwesomePagesMarkers);

			const tree = processor.parse(markdown) as Root;
			const vfile = new VFile({ value: markdown });
			const result = await processor.run(tree, vfile);

			const hasHtmlComments = result.children.some(
				(node) => node.type === 'html',
			);
			expect(hasHtmlComments).toBe(false);
			expect(result.children).toHaveLength(2); // 2 paragraphs
		});
	});

	describe('edge cases', () => {
		it('should handle empty content', async () => {
			const markdown = '';

			const processor = unified()
				.use(remarkParse)
				.use(remarkAwesomePagesMarkers);

			const tree = processor.parse(markdown) as Root;
			const vfile = new VFile({ value: markdown });
			const result = await processor.run(tree, vfile);

			expect(result.children).toHaveLength(0);
			expect(
				(vfile.data as AwesomePagesData).awesomePages?.hasExplicitBlocks,
			).toBe(false);
		});

		it('should handle only markers with no content', async () => {
			const markdown = `<!--awesome-pages:start-->
<!--awesome-pages:end-->`;

			const processor = unified()
				.use(remarkParse)
				.use(remarkAwesomePagesMarkers);

			const tree = processor.parse(markdown) as Root;
			const vfile = new VFile({ value: markdown });
			const result = await processor.run(tree, vfile);

			expect(result.children).toHaveLength(0);
			expect(
				(vfile.data as AwesomePagesData).awesomePages?.hasExplicitBlocks,
			).toBe(true);
		});

		it('should handle unmatched start without end', async () => {
			const markdown = `<!--awesome-pages:start-->
Content after start.

More content.`;

			const processor = unified()
				.use(remarkParse)
				.use(remarkAwesomePagesMarkers);

			const tree = processor.parse(markdown) as Root;
			const vfile = new VFile({ value: markdown });
			const result = await processor.run(tree, vfile);

			expect(result.children.length).toBeGreaterThan(0);
		});

		it('should handle end without start', async () => {
			const markdown = `Content before end.
<!--awesome-pages:end-->
Content after end.`;

			const processor = unified()
				.use(remarkParse)
				.use(remarkAwesomePagesMarkers);

			const tree = processor.parse(markdown) as Root;
			const vfile = new VFile({ value: markdown });
			const result = await processor.run(tree, vfile);

			expect(result.children).toHaveLength(2);
		});
	});
});
