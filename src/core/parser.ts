import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import type { Root, Heading, Paragraph, Yaml, RootContent } from 'mdast';
import remarkAwesomePagesMarkers from '@/plugins/awesomePagesMarkers.js';
import { VFile } from 'vfile';

interface AwesomePagesData {
  awesomePages?: {
    hasExplicitBlocks?: boolean;
  };
}

export interface ParsedAst {
  tree: Root;
  title: string | null;
  description: string | null;
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
  filePath: string
): {
  title: string | null;
  description: string | null;
  frontmatter: Record<string, unknown> | null;
} {
  let frontmatter: Record<string, unknown> | null = null;
  let title: string | null = null;
  let description: string | null = null;
  let foundH1 = false;
  let foundFirstParagraph = false;

  for (const node of tree.children) {
    if (node.type === 'yaml') {
      const yamlNode = node as Yaml;
      frontmatter = parseFrontmatter(yamlNode.value);
      break;
    }
  }

  if (
    frontmatter &&
    frontmatter.title &&
    typeof frontmatter.title === 'string'
  ) {
    title = frontmatter.title;
  }

  if (
    frontmatter &&
    frontmatter.description &&
    typeof frontmatter.description === 'string'
  ) {
    description = frontmatter.description;
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
        description = extractText(para as RootContent).trim();
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

  if (!title) {
    title = path.basename(filePath);
  }

  return { title, description, frontmatter };
}

export async function markdownToAst(filePath: string): Promise<ParsedAst> {
  const markdown = fs.readFileSync(filePath, 'utf8');

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkAwesomePagesMarkers);

  const fullTree = processor.parse(markdown) as Root;

  const { title, description, frontmatter } = extractMetadata(
    fullTree,
    filePath
  );

  const vfile = new VFile({ value: markdown, path: filePath });
  const transformedTree = await processor.run(fullTree, vfile);

  const data = vfile.data as AwesomePagesData;
  const hasExplicitBlocks = data?.awesomePages?.hasExplicitBlocks === true;

  return {
    tree: transformedTree,
    title,
    description,
    frontmatter,
    hasExplicitBlocks,
  };
}
