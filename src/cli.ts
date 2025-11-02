#!/usr/bin/env node
import 'dotenv/config';
import { markdownToAst } from '@/core/parser.js';
import { mdastToDomain } from '@/core/mdastToDomain.js';
import { createSource } from '@/sources/createSource';

// const input = process.argv[2] || 'README.md';
// const input = 'github://teles/awesome-click-and-use@main:README.md';
const input =
  'https://gist.githubusercontent.com/teles/f045f2866245016b4945829938ef03bf/raw/c977dff9bb624723b12cf8cd6d7785e41bcb9074/teste.md';

(async () => {
  const source = createSource(input);
  const markdown = await source.read();
  const { tree, title, description, frontmatter } = await markdownToAst(
    markdown,
    source.id()
  );
  const domain = mdastToDomain(tree, {
    title,
    description,
    frontmatter,
    source: input,
  });
  const schemaUrl = process.env.AWESOME_LIST_SCHEMA;
  const withSchema = {
    $schema: schemaUrl,
    ...domain,
  };
  console.log(JSON.stringify(withSchema, null, 2));
})();
