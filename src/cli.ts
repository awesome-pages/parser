#!/usr/bin/env node
import 'dotenv/config';
import { markdownToAst } from '@/core/parser.js';
import { mdastToDomain } from '@/core/mdastToDomain.js';

const input = process.argv[2] || 'README.md';

(async () => {
  const { tree, title, description, frontmatter } = await markdownToAst(input);
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
