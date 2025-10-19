import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMeta from "../src/plugins/remarkMeta.js";
import { mdastToDomain } from "../src/normalize.js";
import type { Root } from "mdast";

const SAMPLE = `# Awesome Click and Use

<!-- meta { title: 'Awesome Click and Use', categoryOrder: ['Artificial Intelligence','Colors'] } -->

Useful and awesome online tools that I often use.

## Artificial Intelligence
- [ChatGPT](https://chat.openai.com/chat) - Dialogue optimized model
- [NotebookLM](https://notebooklm.google.com/) - AI-powered tool from Google

## Colors
- [Color Designer](https://colordesigner.io/) - Several useful tools
`;

function parseWithMeta(md: string) {
  const proc = unified().use(remarkParse).use(remarkGfm).use(remarkMeta);
  const file = proc.processSync(md);
  const tree = (file.result as Root) ?? (proc.parse(md) as Root);
  const hints = (file.data as any)?.metaHints ?? { blocks: [], regions: [] };
  return { tree, hints };
}

describe("normalize with meta", () => {
  it("aplica meta.title e categoryOrder", () => {
    const { tree, hints } = parseWithMeta(SAMPLE);
    const out = mdastToDomain(tree, hints);

    expect(out.schemaVersion).toBe(1);
    expect(out.meta.title).toBe("Awesome Click and Use");

    expect(out.sections[0].title).toBe("Artificial Intelligence");
    expect(out.sections[0].items.length).toBe(2);
  });
});
