# awesome-parser (boilerplate)

Pipeline in Node + TypeScript to convert README.md from awesome-lists into:

1. AST (mdast) with Remark
2. Domain v1 JSON (validated with Zod), with support for HTML metadata comments

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
