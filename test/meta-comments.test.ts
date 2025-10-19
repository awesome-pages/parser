import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMeta from "../src/plugins/remarkMeta.js";

const SAMPLE = `
<!-- meta { foo: 'bar', nested: { a: 1 } } -->

<!-- awesome:start section="Tools" tags="seo,rank" -->
- [A](http://a.com)
<!-- awesome:end -->
`;

describe("remarkMeta", () => {
  it("coleta blocks e regions", () => {
    const proc = unified().use(remarkParse).use(remarkGfm).use(remarkMeta);
    const file = proc.processSync(SAMPLE);
    const hints = (file.data as any)?.metaHints;
    expect(hints.blocks[0].foo).toBe("bar");
    expect(hints.regions[0].start.section).toBe("Tools");
    expect(hints.regions[1].end).toBe(true);
  });
});
