import type { Root, Content, Heading, List, ListItem, Paragraph, Link, Text } from "mdast";
import { ReadmeDomainSchema, type ReadmeDomain, type Item, type MetaHints } from "./domain.js";
import { slug } from "./utils/slug.js";

function textFrom(node: any): string {
  const parts: string[] = [];
  for (const c of node.children ?? []) {
    if (c.type === "text" || c.type === "inlineCode") parts.push(c.value);
    if (c.type === "link" && c.children?.[0]?.type === "text") parts.push(c.children[0].value);
  }
  return parts.join("").trim();
}

function firstLink(p: Paragraph): Link | null {
  for (const c of p.children) if (c.type === "link") return c as Link;
  return null;
}

function afterLinkText(p: Paragraph, link: Link | null): string | null {
  const parts: string[] = [];
  let seen = link === null;
  for (const c of p.children) {
    if (c === link) { seen = true; continue; }
    if (!seen) continue;
    if (c.type === "text") parts.push((c as Text).value);
  }
  const txt = parts.join("").replace(/^(\s*[-–—:]\s*)/, "").trim();
  return txt || null;
}

function listItemToItem(li: ListItem): Item | null {
  const firstPara = li.children.find(n => n.type === "paragraph") as Paragraph | undefined;
  if (!firstPara) return null;
  const link = firstLink(firstPara);
  const title = link ? textFrom(link) : textFrom(firstPara);
  if (!title) return null;

  const item: Item = {
    id: slug(title),
    title,
    url: link?.url,
    description: afterLinkText(firstPara, link),
    descriptionHtml: null,
    tags: []
  };

  return item;
}

function applyMetaBlocks(candidate: ReadmeDomain, hints: MetaHints): ReadmeDomain {
  const metaTitle = hints.blocks.find(b => typeof b?.title === "string") as any;
  if (metaTitle?.title) {
    candidate.meta.title = String(metaTitle.title);
  }
  const order = (hints.blocks.find(b => Array.isArray((b as any).categoryOrder)) as any)?.categoryOrder as string[] | undefined;
  if (order) {
    const map = new Map(order.map((k, i) => [k.toLowerCase(), i]));
    candidate.sections.sort((a, b) => (map.get(a.title.toLowerCase()) ?? 1e9) - (map.get(b.title.toLowerCase()) ?? 1e9));
  }
  return candidate;
}

export function mdastToDomain(tree: Root, metaHints: MetaHints): ReadmeDomain {
  const sections: ReadmeDomain["sections"] = [];
  let current: { id: string; title: string; items: Item[] } | null = null;
  let introHtml: string | null = null;

  for (const node of tree.children) {
    if (node.type === "heading" && (node.depth === 1 || node.depth === 2 || node.depth === 3)) {
      const title = textFrom(node);
      current = { id: slug(title), title, items: [] };
      sections.push(current);
      continue;
    }
    if (node.type === "paragraph" && !current) {
      const txt = textFrom(node);
      if (txt) introHtml = `<p>${txt}</p>`;
      continue;
    }
    if (node.type === "list" && current) {
      for (const li of (node as List).children) {
        const item = listItemToItem(li);
        if (item) current.items.push(item);
      }
    }
  }

  const candidate: ReadmeDomain = ReadmeDomainSchema.parse({
    schemaVersion: 1 as const,
    meta: { introHtml: introHtml ?? null, generatedAt: new Date().toISOString(), source: null },
    sections
  });

  return applyMetaBlocks(candidate, metaHints);
}
