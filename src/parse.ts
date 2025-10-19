import fs from "node:fs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root } from "mdast";
import remarkMeta from "./plugins/remarkMeta.js";
import type { MetaHints } from "./domain.js";

export interface Parsed {
  tree: Root;
  metaHints: MetaHints;
}

export async function readmeToAst(path: string): Promise<Parsed> {
  const md = fs.readFileSync(path, "utf8");
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMeta);
  const tree = processor.parse(md) as Root;
  const metaHints = (processor.data as any)?.metaHints ?? { blocks: [], regions: [] };
  return { tree, metaHints };
}
