import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMeta from "../src/plugins/remarkMeta.js";
import { mdastToDomain } from "../src/normalize.js";
import type { Root } from "mdast";

const MD = `# Section

- [Parent no children](https://example.com) - has no sublist
- [Parent with children](https://example.org) - has sublist
  - [Child item](https://child.example)
`;

function parseWithMeta(md: string) {
  const proc = unified().use(remarkParse).use(remarkGfm).use(remarkMeta);
  const file = proc.processSync(md);
  const tree = (file.result as Root) ?? (proc.parse(md) as Root);
  const hints = (file.data as any)?.metaHints ?? { blocks: [], regions: [] };
  return { tree, hints };
}

describe("children presence", () => {
  it("omits children when empty and includes when present", () => {
    const { tree, hints } = parseWithMeta(MD);
    const out = mdastToDomain(tree, hints);
    const items = out.sections[0].items;
    const parentNo = items.find(i => i.title === "Parent no children");
    const parentWith = items.find(i => i.title === "Parent with children");

    expect(parentNo).toBeDefined();
    expect(parentWith).toBeDefined();

    // parentNo should not have the property 'children'
    expect(Object.prototype.hasOwnProperty.call(parentNo as any, 'children')).toBe(false);

    // parentWith should have children array with one item
    expect(Array.isArray((parentWith as any).children)).toBe(true);
    expect(((parentWith as any).children as any[]).length).toBe(1);
  });
});
