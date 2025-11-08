import path from 'node:path';
import type { Heading, Paragraph, Root, RootContent, Yaml } from 'mdast';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import remarkAwesomePagesMarkers from '@/plugins/awesomePagesMarkers.js';
import { escapeHtml } from '@/core/helpers/escapeHtml';

interface AwesomePagesData {
	awesomePages?: {
		hasExplicitBlocks?: boolean;
	};
}

export interface ParsedAst {
	tree: Root;
	title: string | null;
	description: string | null;
	descriptionHtml: string | null;
	frontmatter: Record<string, unknown> | null;
	hasExplicitBlocks: boolean;
}

function extractText(node: RootContent): string {
	if (node.type === 'html') {
		return '';
	}

	if (node.type === 'image') {
		return '';
	}

	if (
		'value' in node &&
		typeof (node as { value?: unknown }).value === 'string'
	) {
		return (node as { value: string }).value;
	}

	if (
		'children' in node &&
		Array.isArray((node as { children?: unknown }).children)
	) {
		return (node as { children: RootContent[] }).children
			.map((child) => extractText(child))
			.filter((text) => text.length > 0)
			.join('');
	}

	return '';
}

function parseFrontmatter(yamlContent: string): Record<string, unknown> | null {
	try {
		const lines = yamlContent.split('\n');
		const result: Record<string, unknown> = {};

		for (const line of lines) {
			const match = line.match(/^(\w+):\s*(.+)$/);
			if (match) {
				const [, key, value] = match;
				result[key] = value.replace(/^["']|["']$/g, '').trim();
			}
		}

		return Object.keys(result).length > 0 ? result : null;
	} catch {
		return null;
	}
}

function extractMetadata(
	tree: Root,
	sourceId?: string,
): {
	title: string | null;
	description: string | null;
	descriptionHtml: string | null;
	frontmatter: Record<string, unknown> | null;
} {
	let frontmatter: Record<string, unknown> | null = null;
	let title: string | null = null;
	let description: string | null = null;
	let descriptionHtml: string | null = null;
	let foundH1 = false;
	let foundFirstParagraph = false;

	for (const node of tree.children) {
		if (node.type === 'yaml') {
			const yamlNode = node as Yaml;
			frontmatter = parseFrontmatter(yamlNode.value);
			break;
		}
	}

	if (frontmatter?.title && typeof frontmatter.title === 'string') {
		title = frontmatter.title;
	}

	if (frontmatter?.description && typeof frontmatter.description === 'string') {
		description = frontmatter.description;

		// Generate HTML for descriptionHtml based on frontmatter description
		const para: Paragraph = {
			type: 'paragraph',
			children: [
				{
					type: 'text',
					value: description,
				},
			],
		};
		const hast = toHast(para, { allowDangerousHtml: false });
		if (hast) {
			descriptionHtml = toHtml(hast);
		} else {
			descriptionHtml = `<p>${escapeHtml(description)}</p>`;
		}
	}

	for (const node of tree.children) {
		if (node.type === 'yaml' || node.type === 'html') {
			continue;
		}

		if (!title && node.type === 'heading') {
			const heading = node as Heading;
			if (heading.depth === 1) {
				title = extractText(heading as RootContent).trim();
				foundH1 = true;
			}
		}

		if (
			!description &&
			(foundH1 || frontmatter?.title) &&
			node.type === 'paragraph'
		) {
			if (!foundFirstParagraph) {
				const para = node as Paragraph;
				const text = extractText(para as RootContent).trim();
				if (text.length > 0) {
					description = text;

					// Generate safe HTML fragment for descriptionHtml
					const hast = toHast(para, { allowDangerousHtml: false });
					if (hast) {
						descriptionHtml = toHtml(hast);
					} else {
						descriptionHtml = `<p>${description}</p>`;
					}
				}
				foundFirstParagraph = true;
				break;
			}
		}

		if (foundH1 && node.type === 'heading') {
			const heading = node as Heading;
			if (heading.depth >= 2) {
				break;
			}
		}
	}

	if (!title && sourceId) {
		title = path.basename(sourceId);
	}

	return { title, description, descriptionHtml, frontmatter };
}

export async function markdownToAst(
	markdown: string,
	sourceId?: string,
): Promise<ParsedAst> {
	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkFrontmatter, ['yaml'])
		.use(remarkAwesomePagesMarkers);

	const fullTree = processor.parse(markdown) as Root;

	const { title, description, descriptionHtml, frontmatter } = extractMetadata(
		fullTree,
		sourceId,
	);

	const vfile = new VFile({ value: markdown, path: sourceId });
	const transformedTree = await processor.run(fullTree, vfile);

	const data = vfile.data as AwesomePagesData;
	const hasExplicitBlocks = data?.awesomePages?.hasExplicitBlocks === true;

	return {
		tree: transformedTree,
		title,
		description,
		descriptionHtml,
		frontmatter,
		hasExplicitBlocks,
	};
}
