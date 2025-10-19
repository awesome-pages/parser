#!/usr/bin/env node
import fs from "node:fs";
import 'dotenv/config';
import { readmeToAst } from "./parse.js";
import { mdastToDomain } from "./normalize.js";

const input = process.argv[2] || "README.md";
const output = process.argv[3] || "readme.domain.json";

(async () => {
  const { tree, metaHints } = await readmeToAst(input);
  const domain = mdastToDomain(tree, metaHints);
  const schemaUrl = process.env.AWESOME_LIST_SCHEMA || "https://teles.dev.br/schemas/awesome-list/v1.json";
  const withSchema = {
    "$schema": schemaUrl,
    ...domain
  };
  fs.writeFileSync(output, JSON.stringify(withSchema, null, 2));
  console.log(`✅ JSON generated in ${output}`);
})();
