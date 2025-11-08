import type {
	Heading,
	Link,
	List,
	Paragraph,
	PhrasingContent,
	Root,
	RootContent,
	Text,
} from 'mdast';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { visit } from 'unist-util-visit';
import { computeDeterministicItemId } from '@/core/helpers/computeDeterministicItemId.js';
import extractInlineTags from '@/core/helpers/extractInlineTags';
import {
	DomainV1Schema,
	type ItemV1,
	ItemV1Schema,
	type SectionV1,
	SectionV1Schema,
} from '@/schemas/v1/domain.v1.js';

interface Options {
	title?: string | null;
	description?: string | null;
	descriptionHtml?: string | null;
	frontmatter?: Record<string, unknown> | null;
	language?: string;
	generatedAt?: string;
	source: string;
	strict?: boolean;
}

function extractText(node: RootContent): string {
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
			.join('');
	}
	return '';
}

function findFirstLink(p: Paragraph): Link | null {
	for (const child of p.children) {
		if (child.type === 'link') return child as Link;
	}
	return null;
}

export function mdastToDomain(tree: Root, opts: Options) {
	const sections: SectionV1[] = [];
	const items: ItemV1[] = [];

	const sectionStack: (string | null)[] = [];
	let sectionOrder = 0;

	visit(tree, (node) => {
		if (node.type === 'heading') {
			const h = node as Heading;
			if (h.depth >= 2) {
				const title = extractText(h as RootContent).trim();
				const parentId =
					h.depth === 2 ? null : (sectionStack[h.depth - 3] ?? null);

				const section = SectionV1Schema.parse({
					title,
					parentId,
					depth: h.depth - 2,
					order: sectionOrder++,
					descriptionHtml: null,
				});

				sections.push(section);
				sectionStack[h.depth - 2] = section.id;
				sectionStack.length = h.depth - 1;
			}
			return;
		}

		if (node.type === 'list') {
			const list = node as List;
			const currentSectionId =
				sectionStack
					.slice()
					.reverse()
					.find((id) => id != null) ?? null;
			if (!currentSectionId) return;

			let itemOrder = 0;

			for (const li of list.children) {
				const para = li.children.find((c) => c.type === 'paragraph') as
					| Paragraph
					| undefined;
				if (!para) continue;

				const link = findFirstLink(para);
				const title = link
					? extractText(link as RootContent)
					: extractText(para as RootContent);
				const url = link?.url;

				// Build a paragraph with description only (excluding the link)
				const descChildren: PhrasingContent[] = [];
				for (const ch of para.children) {
					if (ch === link) continue;
					descChildren.push(ch);
				}

				const descParts: string[] = [];
				for (const ch of para.children) {
					if (ch === link) continue;
					if (ch.type === 'text') descParts.push((ch as Text).value);
				}
				// Normalize description and remove leading separators like '-', '–', '—', ':'
				const rawDesc = descParts.join(' ').replace(/\s+/g, ' ').trim();
				const normalized = rawDesc ? rawDesc.replace(/^[\s-–—:]+/, '') : '';
				const { clean, tags } = normalized
					? extractInlineTags(normalized)
					: { clean: '', tags: [] };
				const description = clean || null;

				// Generate descriptionHtml from the description paragraph
				let descriptionHtml: string | null = null;
				if (descChildren.length > 0) {
					// Normalize the first text node to remove leading separators
					const normalizedChildren: PhrasingContent[] = descChildren.map(
						(child, idx) => {
							if (idx === 0 && child.type === 'text') {
								const textNode = child as Text;
								const cleaned = textNode.value.replace(/^[\s-–—:]+/, '');
								return { ...textNode, value: cleaned };
							}
							return child;
						},
					);

					// Create a paragraph node with description content
					const descParagraph: Paragraph = {
						type: 'paragraph',
						children: normalizedChildren,
					};
					const hast = toHast(descParagraph);
					if (hast) {
						descriptionHtml = toHtml(hast);
					}
				}

				const id = computeDeterministicItemId(currentSectionId, title);
				const item = ItemV1Schema.parse({
					id,
					sectionId: currentSectionId,
					title,
					url,
					description,
					descriptionHtml,
					order: itemOrder++,
					tags,
				});
				items.push(item);
			}
		}
	});

	const domain = {
		schemaVersion: 1 as const,
		meta: {
			title: opts.title ?? undefined,
			description: opts.description ?? undefined,
			descriptionHtml: opts.descriptionHtml ?? undefined,
			generatedAt: opts.generatedAt ?? new Date().toISOString(),
			source: opts.source,
			language: opts.language ?? undefined,
			frontmatter: opts.frontmatter ?? undefined,
		},
		sections,
		items,
	};

	return DomainV1Schema.parse(domain);
}
