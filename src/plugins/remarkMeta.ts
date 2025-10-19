import { visit } from "unist-util-visit";
import type { Root, RootContent, Html } from "mdast";
import type { VFile } from "vfile";
import JSON5 from "json5";
import type { MetaHints, RegionMarker } from "../domain.js";

/**
 * Extrai metadados de comentários HTML no Markdown.
 * Suporta:
 *  - <!-- meta { ... } -->   → blocks[] (JSON5)
 *  - <!-- awesome:start key="value" ... --> / <!-- awesome:end --> → regions[]
 */
export default function remarkMeta() {
  return (tree: Root, file: VFile) => {
    const hints: MetaHints = { blocks: [], regions: [] };

    visit(tree, "html", (node: Html) => {
      if (typeof node.value !== "string") return;
      const raw = node.value.trim();

      // Bloco meta JSON5
      const metaMatch = raw.match(/^<!--\s*meta\s*([\s\S]*?)\s*-->/i);
      if (metaMatch) {
        const txt = metaMatch[1].trim();
        if (txt) {
          try { hints.blocks.push(JSON5.parse(txt)); } catch {}
        }
        return;
      }

      // Marcadores awesome:start / awesome:end com atributos key="value"
      const startMatch = raw.match(/^<!--\s*awesome:start\s+([^>]*)-->/i);
      if (startMatch) {
        const attrs = startMatch[1];
        const obj: Record<string, string> = {};
        for (const m of attrs.matchAll(/(\w+)="([^"]*)"/g)) {
          obj[m[1]] = m[2];
        }
        hints.regions.push({ start: obj } as RegionMarker);
        return;
      }

      const endMatch = raw.match(/^<!--\s*awesome:end\s*-->/i);
      if (endMatch) {
        hints.regions.push({ end: true });
        return;
      }
    });

    file.data = file.data || {};
    file.data.metaHints = hints;
  };
}
