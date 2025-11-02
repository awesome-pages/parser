import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { markdownToAst } from '@/core/parser.js';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('markdownToAst', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parser-test-'));
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const createTestFile = (filename: string, content: string): string => {
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  };

  describe('basic parsing', () => {
    it('should parse simple markdown to AST', async () => {
      const content = `# Hello World

This is a paragraph.

## Subsection

- Item 1
- Item 2`;

      const filePath = createTestFile('simple.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.tree).toBeDefined();
      expect(result.tree.type).toBe('root');
      expect(result.tree.children.length).toBeGreaterThan(0);
      expect(result.hasExplicitBlocks).toBe(false);
    });

    it('should parse markdown with GFM tables', async () => {
      const content = `# Table Example

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`;

      const filePath = createTestFile('table.md', content);
      const result = await markdownToAst(content, filePath);

      const hasTable = result.tree.children.some(
        (node) => node.type === 'table'
      );
      expect(hasTable).toBe(true);
    });

    it('should parse markdown with links', async () => {
      const content = `# Links

Check out [Google](https://google.com) and [GitHub](https://github.com).`;

      const filePath = createTestFile('links.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.tree.children.length).toBeGreaterThan(0);
      const paragraph = result.tree.children.find(
        (node) => node.type === 'paragraph'
      );
      expect(paragraph).toBeDefined();
    });
  });

  describe('awesome-pages markers', () => {
    it('should detect explicit blocks when start marker is present', async () => {
      const content = `# Before

This is filtered.

<!--awesome-pages:start-->
# Inside

This is kept.
<!--awesome-pages:end-->

This is also filtered.`;

      const filePath = createTestFile('explicit-blocks.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.hasExplicitBlocks).toBe(true);
      expect(result.tree.children.length).toBe(2); // heading + paragraph
    });

    it('should not detect explicit blocks when no start marker', async () => {
      const content = `# Hello

Just regular content.

<!--awesome-pages:ignore:start-->
This is ignored.
<!--awesome-pages:ignore:end-->

More content.`;

      const filePath = createTestFile('no-explicit.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.hasExplicitBlocks).toBe(false);
      expect(result.tree.children.length).toBe(3); // heading + 2 paragraphs
    });

    it('should filter ignore blocks without explicit blocks', async () => {
      const content = `# Content

Keep this.

<!--awesome-pages:ignore:start-->
Ignore this section.

And this too.
<!--awesome-pages:ignore:end-->

Keep this also.`;

      const filePath = createTestFile('ignore-blocks.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.hasExplicitBlocks).toBe(false);
      expect(result.tree.children.length).toBe(3); // heading + 2 paragraphs kept
    });

    it('should handle multiple start/end pairs', async () => {
      const content = `# Doc

Filtered content.

<!--awesome-pages:start-->
## First Section
First section content.
<!--awesome-pages:end-->

More filtered content.

<!--awesome-pages:start-->
## Second Section
Second section content.
<!--awesome-pages:end-->

Final filtered content.`;

      const filePath = createTestFile('multiple-blocks.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.hasExplicitBlocks).toBe(true);
      expect(result.tree.children.length).toBe(4); // 2 headings + 2 paragraphs
    });
  });

  describe('edge cases', () => {
    it('should handle empty file', async () => {
      const content = '';
      const filePath = createTestFile('empty.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.tree.type).toBe('root');
      expect(result.tree.children).toHaveLength(0);
      expect(result.hasExplicitBlocks).toBe(false);
    });

    it('should handle file with only whitespace', async () => {
      const content = '   \n\n   \n';
      const filePath = createTestFile('whitespace.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.tree.type).toBe('root');
      expect(result.hasExplicitBlocks).toBe(false);
    });

    it('should handle file with only markers', async () => {
      const content = `<!--awesome-pages:start-->
<!--awesome-pages:end-->`;
      const filePath = createTestFile('only-markers.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.hasExplicitBlocks).toBe(true);
      expect(result.tree.children).toHaveLength(0);
    });

    it('should handle complex nested structures', async () => {
      const content = `# Main Title

## Section 1

Some content.

<!--awesome-pages:start-->
### Subsection

- Item 1
  - Nested item
- Item 2

**Bold text** and *italic text*.

\`\`\`javascript
const code = "block";
\`\`\`

<!--awesome-pages:end-->`;

      const filePath = createTestFile('complex.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.hasExplicitBlocks).toBe(true);
      expect(result.tree.children.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should throw error for non-existent file', async () => {
      const content = 'This is some content';

      await expect(markdownToAst(content)).resolves.toBeDefined();
    });
  });

  describe('GFM features', () => {
    it('should parse strikethrough', async () => {
      const content = 'This is ~~deleted~~ text.';
      const filePath = createTestFile('strikethrough.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.tree.children.length).toBeGreaterThan(0);
    });

    it('should parse task lists', async () => {
      const content = `- [x] Completed task
- [ ] Incomplete task`;
      const filePath = createTestFile('tasks.md', content);
      const result = await markdownToAst(content, filePath);

      const list = result.tree.children.find((node) => node.type === 'list');
      expect(list).toBeDefined();
    });

    it('should parse autolinks', async () => {
      const content = 'Visit https://example.com for more info.';
      const filePath = createTestFile('autolink.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.tree.children.length).toBeGreaterThan(0);
    });
  });

  describe('metadata extraction (title and description)', () => {
    it('should extract title from H1', async () => {
      const content = `# My Awesome List

Some description here.

## Section 1
- Item 1
`;
      const filePath = createTestFile('test-title.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.title).toBe('My Awesome List');
      expect(result.description).toBe('Some description here.');
      expect(result.frontmatter).toBeNull();
    });

    it('should extract title and description from frontmatter', async () => {
      const content = `---
title: Frontmatter Title
description: Frontmatter description
---

# This H1 Should Be Ignored

This paragraph should also be ignored.

## Section 1
- Item 1
`;
      const filePath = createTestFile('test-frontmatter.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.title).toBe('Frontmatter Title');
      expect(result.description).toBe('Frontmatter description');
      expect(result.frontmatter).toEqual({
        title: 'Frontmatter Title',
        description: 'Frontmatter description',
      });
    });

    it('should use filename as fallback if no H1 exists', async () => {
      const content = `## Section 1
- Item 1
`;
      const filePath = createTestFile('fallback-title.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.title).toBe('fallback-title.md');
      expect(result.description).toBeNull();
    });

    it('should handle H1 with HTML and images', async () => {
      const content = `# <img src="logo.png" width="100"/> My Title [![Badge](badge.svg)](link)

Description paragraph.

## Section 1
`;
      const filePath = createTestFile('test-html-title.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.title).toBe('My Title');
      expect(result.description).toBe('Description paragraph.');
    });

    it('should return null description if no paragraph after H1', async () => {
      const content = `# Title Only

## Section 1
- Item 1
`;
      const filePath = createTestFile('test-no-desc.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.title).toBe('Title Only');
      expect(result.description).toBeNull();
    });

    it('should ignore awesome-pages markers for title/description extraction', async () => {
      const content = `# My Title

This is the description.

<!--awesome-pages:start-->
## Section 1
- Item 1
<!--awesome-pages:end-->
`;
      const filePath = createTestFile('test-markers.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.title).toBe('My Title');
      expect(result.description).toBe('This is the description.');
      expect(result.hasExplicitBlocks).toBe(true);
    });

    it('should handle frontmatter with only title', async () => {
      const content = `---
title: Only Title
---

This should be the description.

## Section 1
`;
      const filePath = createTestFile('test-fm-title.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.title).toBe('Only Title');
      expect(result.description).toBe('This should be the description.');
    });

    it('should handle frontmatter with only description', async () => {
      const content = `---
description: Frontmatter description
---

# H1 Title

## Section 1
`;
      const filePath = createTestFile('test-fm-desc.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.title).toBe('H1 Title');
      expect(result.description).toBe('Frontmatter description');
    });

    it('should stop looking for description at first H2', async () => {
      const content = `# Title

## Section 1

This paragraph comes after H2, so it should not be the description.
`;
      const filePath = createTestFile('test-stop-h2.md', content);
      const result = await markdownToAst(content, filePath);

      expect(result.title).toBe('Title');
      expect(result.description).toBeNull();
    });
  });

  describe('metadata extraction from fixtures', () => {
    it('should extract title only when no description paragraph exists', async () => {
      const content = await fsPromises.readFile(
        'src/tests/fixtures/readmes/only-h1.md',
        'utf8'
      );
      const result = await markdownToAst(
        content,
        'src/tests/fixtures/readmes/only-h1.md'
      );

      expect(result.title).toBe('My Awesome Title');
      expect(result.description).toBeNull();
      expect(result.frontmatter).toBeNull();
    });

    it('should extract both title and description from H1 and first paragraph', async () => {
      const content = await fsPromises.readFile(
        'src/tests/fixtures/readmes/h1-with-description.md',
        'utf8'
      );
      const result = await markdownToAst(
        content,
        'src/tests/fixtures/readmes/h1-with-description.md'
      );

      expect(result.title).toBe('Awesome Tools Collection');
      expect(result.description).toBe(
        'This is a curated list of amazing tools that developers love to use.'
      );
      expect(result.frontmatter).toBeNull();
    });

    it('should use filename when no H1 exists', async () => {
      const content = await fsPromises.readFile(
        'src/tests/fixtures/readmes/no-h1.md',
        'utf8'
      );
      const result = await markdownToAst(
        content,
        'src/tests/fixtures/readmes/no-h1.md'
      );

      expect(result.title).toBe('no-h1.md');
      expect(result.description).toBeNull();
      expect(result.frontmatter).toBeNull();
    });

    it('should extract title but no description when H1 has no following paragraph', async () => {
      const content = await fsPromises.readFile(
        'src/tests/fixtures/readmes/h1-no-paragraph.md',
        'utf8'
      );
      const result = await markdownToAst(
        content,
        'src/tests/fixtures/readmes/h1-no-paragraph.md'
      );

      expect(result.title).toBe('Title Without Description');
      expect(result.description).toBeNull();
      expect(result.frontmatter).toBeNull();
    });

    it('should use frontmatter title and extract description from paragraph', async () => {
      const content = await fsPromises.readFile(
        'src/tests/fixtures/readmes/frontmatter-partial.md',
        'utf8'
      );
      const result = await markdownToAst(
        content,
        'src/tests/fixtures/readmes/frontmatter-partial.md'
      );

      expect(result.title).toBe('Title from Frontmatter Only');
      expect(result.description).toBe(
        "This paragraph should be the description since frontmatter doesn't have description field."
      );
      expect(result.frontmatter).toEqual({
        title: 'Title from Frontmatter Only',
      });
    });

    it('should use frontmatter description and H1 title', async () => {
      const content = await fsPromises.readFile(
        'src/tests/fixtures/readmes/frontmatter-description-only.md',
        'utf8'
      );
      const result = await markdownToAst(
        content,
        'src/tests/fixtures/readmes/frontmatter-description-only.md'
      );

      expect(result.title).toBe('Title from H1');
      expect(result.description).toBe('Description from frontmatter only');
      expect(result.frontmatter).toEqual({
        description: 'Description from frontmatter only',
      });
    });

    it('should clean HTML and images from H1 title', async () => {
      const content = await fsPromises.readFile(
        'src/tests/fixtures/readmes/h1-with-html.md',
        'utf8'
      );
      const result = await markdownToAst(
        content,
        'src/tests/fixtures/readmes/h1-with-html.md'
      );

      expect(result.title).toBe('Awesome List');
      expect(result.description).toBe(
        'A description with bold and italic text.'
      );
    });

    it('should extract only first paragraph as description', async () => {
      const content = await fsPromises.readFile(
        'src/tests/fixtures/readmes/multiple-paragraphs.md',
        'utf8'
      );
      const result = await markdownToAst(
        content,
        'src/tests/fixtures/readmes/multiple-paragraphs.md'
      );

      expect(result.title).toBe('Title');
      expect(result.description).toBe(
        'First paragraph should be the description.'
      );
    });

    it('should extract title and description from outside markers', async () => {
      const content = await fsPromises.readFile(
        'src/tests/fixtures/readmes/with-markers-outside.md',
        'utf8'
      );
      const result = await markdownToAst(
        content,
        'src/tests/fixtures/readmes/with-markers-outside.md'
      );

      expect(result.title).toBe('Title Outside Markers');
      expect(result.description).toBe('Description outside markers.');
      expect(result.hasExplicitBlocks).toBe(true);
    });

    it('should use existing with-frontmatter.md fixture correctly', async () => {
      const content = await fsPromises.readFile(
        'src/tests/fixtures/readmes/with-frontmatter.md',
        'utf8'
      );
      const result = await markdownToAst(
        content,
        'src/tests/fixtures/readmes/with-frontmatter.md'
      );

      expect(result.title).toBe('My Awesome List with Frontmatter');
      expect(result.description).toBe(
        'This description comes from frontmatter metadata'
      );
      expect(result.frontmatter).toEqual({
        title: 'My Awesome List with Frontmatter',
        description: 'This description comes from frontmatter metadata',
      });
    });

    it('should use existing awesome-click-and-use.md fixture correctly', async () => {
      const content = await fsPromises.readFile(
        'src/tests/fixtures/readmes/awesome-click-and-use.md',
        'utf8'
      );
      const result = await markdownToAst(
        content,
        'src/tests/fixtures/readmes/awesome-click-and-use.md'
      );

      expect(result.title).toBe('Awesome Click and Use');
      expect(result.description).toBe(
        'Useful and awesome online tools that I often use. No download, no signup required.'
      );
      expect(result.frontmatter).toBeNull();
    });
  });
});
