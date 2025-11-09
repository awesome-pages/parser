import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildIndex } from '@/core/helpers/buildIndex';
import { mdastToDomain } from '@/core/mdastToDomain';
import { markdownToAst } from '@/core/parser';

describe('Language feature integration', () => {
	it('should extract language from frontmatter', async () => {
		const markdown = `---
title: Test List
language: pt-BR
---

# Test

A test list.

## Section

- [Item](https://example.com/) - An item
`;

		const { tree, title, description, descriptionHtml, frontmatter, language } =
			await markdownToAst(markdown, 'test.md');

		expect(language).toBe('pt-br');
		expect(frontmatter?.language).toBe('pt-BR');

		const domain = mdastToDomain(tree, {
			title,
			description,
			descriptionHtml,
			frontmatter,
			language,
			source: 'test.md',
		});

		expect(domain.meta.language).toBe('pt-br');
	});

	it('should infer language when not in frontmatter', async () => {
		const markdown = `# Lista em Português

Esta é uma lista incrível em português brasileiro.

## Ferramentas

- [Exemplo](https://example.com/) - Uma ferramenta de exemplo para desenvolvimento
`;

		const { tree, title, description, descriptionHtml, frontmatter, language } =
			await markdownToAst(markdown, 'test.md');

		// Should detect Portuguese
		expect(language).toBe('pt');

		const domain = mdastToDomain(tree, {
			title,
			description,
			descriptionHtml,
			frontmatter,
			language,
			source: 'test.md',
		});

		expect(domain.meta.language).toBe('pt');
	});

	it('should default to English for short or ambiguous text', async () => {
		const markdown = `# Test

Short.

## Section

- [Item](https://example.com/) - Test
`;

		const { language } = await markdownToAst(markdown, 'test.md');

		// Should default to English for very short text
		expect(language).toBe('en');
	});

	it('should use language-specific stopwords in index building', async () => {
		const markdownPt = `---
language: pt
---

# Lista de Ferramentas

Uma lista de ferramentas úteis.

## Ferramentas

- [Ferramenta](https://example.com/) - Uma ferramenta para desenvolvimento de software
`;

		const { tree, title, description, descriptionHtml, frontmatter, language } =
			await markdownToAst(markdownPt, 'test.md');

		const domain = mdastToDomain(tree, {
			title,
			description,
			descriptionHtml,
			frontmatter,
			language,
			source: 'test.md',
		});

		const index = buildIndex(domain);

		// Portuguese stopwords like 'de', 'para', 'uma' should be filtered out
		expect(index.terms['de']).toBeUndefined();
		expect(index.terms['para']).toBeUndefined();
		expect(index.terms['uma']).toBeUndefined();

		// But actual content words should be present
		expect(index.terms['ferramenta']).toBeDefined();
		expect(index.terms['desenvolvimento']).toBeDefined();
		expect(index.terms['software']).toBeDefined();
	});

	it('should process the Portuguese fixture file correctly', async () => {
		const fixtureDir = new URL(
			'../../tests/fixtures/readmes/',
			import.meta.url,
		);
		const fixturePath = path.join(
			fixtureDir.pathname,
			'portuguese-language.md',
		);
		const markdown = await fs.readFile(fixturePath, 'utf-8');

		const { tree, title, description, descriptionHtml, frontmatter, language } =
			await markdownToAst(markdown, fixturePath);

		expect(language).toBe('pt-br');
		expect(title).toBe('Lista Incrível em Português');

		const domain = mdastToDomain(tree, {
			title,
			description,
			descriptionHtml,
			frontmatter,
			language,
			source: fixturePath,
		});

		expect(domain.meta.language).toBe('pt-br');
		expect(domain.items.length).toBeGreaterThan(0);

		const index = buildIndex(domain);

		// Verify Portuguese stopwords are filtered
		expect(index.terms['de']).toBeUndefined();
		expect(index.terms['uma']).toBeUndefined();

		// Verify content words are indexed
		expect(index.terms['ferramenta']).toBeDefined();
		expect(index.terms['documentação']).toBeDefined();
	});
});
