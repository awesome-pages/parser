# awesome-parser (boilerplate)

Pipeline in Node + TypeScript to convert README.md from awesome-lists into:

1. AST (mdast) with Remark
2. Domain v1 JSON (validated with Zod), with support for HTML metadata comments
3. Multiple output artifacts: domain JSON, index JSON, bookmarks HTML, and sitemap XML

## Scripts

- `pnpm test` — runs the tests (Vitest)
- `pnpm build` — compiles TypeScript
- `pnpm parse` — runs CLI: `tsx src/cli.ts README.md readme.domain.json`

## Examples

Example README.md files are available in the `examples/` directory. You can test the parser on them, e.g.:

```
pnpm parse examples/awesome-click-and-use.md examples/awesome-click-and-use.json
```

## JSON Schema

The v1 schema is in `schemas/awesome-list.v1.json` and is referenced via `$schema` in the emitted JSON.

## Available Artifacts

The parser can generate multiple types of output artifacts:

### 1. `domain` (JSON)
The complete domain model with all metadata, sections, and items in a structured JSON format.

### 2. `index` (JSON)
A simplified index of the content, useful for building navigation or search functionality.

### 3. `bookmarks` (HTML)
A browser-compatible bookmarks file in the Netscape Bookmark File Format. Can be imported directly into Chrome, Firefox, Edge, and other modern browsers.

### 4. `sitemap` (XML)
An XML sitemap following the [Sitemap Protocol](https://www.sitemaps.org/protocol.html). Includes all items with valid URLs and can be submitted to search engines like Google and Bing for better indexing.

### 5. `rss-json` (JSON Feed)
A feed in [JSON Feed v1.1](https://jsonfeed.org/version/1.1) format. Modern, JSON-based alternative to RSS/Atom, easier to parse in JavaScript applications. Each item with a URL becomes a feed entry.

### 6. `rss-xml` (RSS 2.0)
A classic RSS 2.0 XML feed compatible with traditional feed readers like Feedly, Inoreader, and Thunderbird. Each item with a URL becomes a feed entry.

## Usage Example

```typescript
import { parse } from './src/api/index';

await parse({
  sources: [
    {
      from: ['github://user/repo@main:README.md'],
      outputs: [
        {
          artifact: ['domain', 'index'],
          to: 'dist/{repo}.{artifact}.json',
        },
        {
          artifact: 'bookmarks',
          to: 'dist/{repo}.bookmarks.html',
        },
        {
          artifact: 'sitemap',
          to: 'dist/{repo}.sitemap.xml',
        },
        {
          artifact: 'rss-json',
          to: 'dist/{repo}.rss.json',
        },
        {
          artifact: 'rss-xml',
          to: 'dist/{repo}.rss.xml',
        },
      ],
    },
  ],
});
```
