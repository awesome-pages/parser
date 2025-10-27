import type {
  Root,
  RootContent,
  Heading,
  List,
  Paragraph,
  Link,
  Text,
} from 'mdast';
import { visit } from 'unist-util-visit';
import {
  DomainV1Schema,
  SectionV1Schema,
  ItemV1Schema,
  type SectionV1,
  type ItemV1,
} from '@/schemas/domain.v1.js';

interface Options {
  title?: string | null;
  description?: string | null;
  frontmatter?: Record<string, unknown> | null;
  generatedAt?: string;
  source?: string;
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

export function mdastToDomain(tree: Root, opts: Options = {}) {
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

        const descParts: string[] = [];
        for (const ch of para.children) {
          if (ch === link) continue;
          if (ch.type === 'text') descParts.push((ch as Text).value);
        }
        const description =
          descParts.join(' ').replace(/\s+/g, ' ').trim() || null;

        const item = ItemV1Schema.parse({
          sectionId: currentSectionId,
          title,
          url,
          description,
          order: itemOrder++,
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
      generatedAt: opts.generatedAt ?? new Date().toISOString(),
      source: opts.source,
      frontmatter: opts.frontmatter ?? undefined,
    },
    sections,
    items,
  };

  return DomainV1Schema.parse(domain);
}
