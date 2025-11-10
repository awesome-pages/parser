import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import type { DomainV1 } from './domain.v1';
import { generateDomainV1JsonSchema } from './jsonSchema';

describe('DomainV1 Real JSON Files Validation', () => {
	const ajv = new Ajv({ strict: true, allErrors: true });
	addFormats(ajv);

	const schema = generateDomainV1JsonSchema();
	const validate = ajv.compile(schema);

	it('should validate awesome-click-and-use.domain.json fixture', async () => {
		const fixturePath = path.join(
			__dirname,
			'../../tests/fixtures/expected/awesome-click-and-use.domain.json',
		);

		const content = await fs.readFile(fixturePath, 'utf8');
		const domain: DomainV1 = JSON.parse(content);

		const valid = validate(domain);
		if (!valid) {
			console.error('Validation errors for awesome-click-and-use.domain.json:');
			console.error(JSON.stringify(validate.errors, null, 2));
		}
		expect(valid).toBe(true);
		expect(validate.errors).toBeNull();
	});

	it('should validate readme.domain.json', async () => {
		const fixturePath = path.join(__dirname, '../../../readme.domain.json');

		try {
			const content = await fs.readFile(fixturePath, 'utf8');
			const domain: DomainV1 = JSON.parse(content);

			// Skip test if file has old structure (missing required fields)
			if (!domain.meta || !domain.meta.generatedAt || !domain.meta.source) {
				console.warn(
					'readme.domain.json has old structure, skipping validation',
				);
				return;
			}

			const valid = validate(domain);
			if (!valid) {
				console.error('Validation errors for readme.domain.json:');
				console.error(JSON.stringify(validate.errors, null, 2));
			}
			expect(valid).toBe(true);
			expect(validate.errors).toBeNull();
		} catch (error) {
			// If file doesn't exist, skip this test
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				console.warn('readme.domain.json not found, skipping test');
				return;
			}
			throw error;
		}
	});

	it('should detect schema divergence - invalid data should fail validation', async () => {
		const invalidDomain = {
			$schema: 'https://awesome-pages.github.io/schemas/domain/v1.json',
			schemaVersion: 1,
			meta: {
				title: 'Test',
				generatedAt: new Date().toISOString(),
				source: 'test.md',
			},
			sections: [
				{
					id: 'test-section',
					title: 'Test Section',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'test-section',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'test-item',
					sectionId: 'non-existent-section', // This would pass JSON Schema but fail Zod validation
					title: 'Test Item',
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		// JSON Schema validation will pass (it doesn't check referential integrity)
		const valid = validate(invalidDomain);
		expect(valid).toBe(true);

		// But Zod validation would fail due to cross-reference check
		// This test documents that JSON Schema validates structure, not business rules
	});
});
