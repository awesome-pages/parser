import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import { generateDomainV1JsonSchema } from './jsonSchema';
import type { DomainV1 } from './domain.v1';

describe('DomainV1 JSON Schema Validation', () => {
	const ajv = new Ajv({ strict: true, allErrors: true });
	addFormats(ajv);

	const schema = generateDomainV1JsonSchema();
	const validate = ajv.compile(schema);

	it('should validate a complete valid DomainV1 object', () => {
		const validDomain: DomainV1 = {
			$schema: 'https://awesome-pages.github.io/schemas/domain/v1.json',
			schemaVersion: 1,
			meta: {
				title: 'Test List',
				description: 'A test awesome list',
				descriptionHtml: '<p>A test awesome list</p>',
				generatedAt: new Date().toISOString(),
				source: 'test.md',
				language: 'en',
				frontmatter: { custom: 'value' },
			},
			sections: [
				{
					id: 'section-1',
					title: 'Section 1',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'section-1',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'item-1',
					sectionId: 'section-1',
					title: 'Item 1',
					url: 'https://example.com',
					description: 'A description',
					descriptionHtml: '<p>A description</p>',
					order: 0,
					tags: ['tag1', 'tag2'],
				},
			],
		};

		const valid = validate(validDomain);
		if (!valid) {
			console.error('Validation errors:', validate.errors);
		}
		expect(valid).toBe(true);
	});

	it('should validate a minimal DomainV1 object', () => {
		const minimalDomain: DomainV1 = {
			schemaVersion: 1,
			meta: {
				generatedAt: new Date().toISOString(),
				source: 'test.md',
			},
			sections: [],
			items: [],
		};

		const valid = validate(minimalDomain);
		if (!valid) {
			console.error('Validation errors:', validate.errors);
		}
		expect(valid).toBe(true);
	});

	it('should validate DomainV1 with nested sections', () => {
		const domainWithNestedSections: DomainV1 = {
			$schema: 'https://awesome-pages.github.io/schemas/domain/v1.json',
			schemaVersion: 1,
			meta: {
				generatedAt: new Date().toISOString(),
				source: 'test.md',
			},
			sections: [
				{
					id: 'parent',
					title: 'Parent Section',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'parent',
					descriptionHtml: null,
				},
				{
					id: 'child',
					title: 'Child Section',
					parentId: 'parent',
					depth: 1,
					order: 1,
					path: 'parent/child',
					descriptionHtml: '<p>Child description</p>',
				},
			],
			items: [],
		};

		const valid = validate(domainWithNestedSections);
		if (!valid) {
			console.error('Validation errors:', validate.errors);
		}
		expect(valid).toBe(true);
	});

	it('should reject invalid schemaVersion', () => {
		const invalidDomain = {
			schemaVersion: 2, // Invalid: should be 1
			meta: {
				generatedAt: new Date().toISOString(),
				source: 'test.md',
			},
			sections: [],
			items: [],
		};

		const valid = validate(invalidDomain);
		expect(valid).toBe(false);
		expect(validate.errors).toBeDefined();
	});

	it('should reject missing required fields', () => {
		const invalidDomain = {
			schemaVersion: 1,
			meta: {
				// Missing required 'generatedAt' and 'source'
			},
			sections: [],
			items: [],
		};

		const valid = validate(invalidDomain);
		expect(valid).toBe(false);
		expect(validate.errors).toBeDefined();
	});

	it('should reject invalid URL format', () => {
		const invalidDomain: any = {
			schemaVersion: 1,
			meta: {
				generatedAt: new Date().toISOString(),
				source: 'test.md',
			},
			sections: [
				{
					id: 'section-1',
					title: 'Section 1',
					parentId: null,
					depth: 0,
					order: 0,
					path: 'section-1',
					descriptionHtml: null,
				},
			],
			items: [
				{
					id: 'item-1',
					sectionId: 'section-1',
					title: 'Item 1',
					url: 'not-a-valid-url', // Invalid URL
					description: null,
					descriptionHtml: null,
					order: 0,
					tags: [],
				},
			],
		};

		const valid = validate(invalidDomain);
		expect(valid).toBe(false);
		expect(validate.errors).toBeDefined();
	});

	it('should reject invalid datetime format', () => {
		const invalidDomain = {
			schemaVersion: 1,
			meta: {
				generatedAt: 'not-a-datetime', // Invalid datetime
				source: 'test.md',
			},
			sections: [],
			items: [],
		};

		const valid = validate(invalidDomain);
		expect(valid).toBe(false);
		expect(validate.errors).toBeDefined();
	});

	it('should reject empty strings in required non-empty fields', () => {
		const invalidDomain: any = {
			schemaVersion: 1,
			meta: {
				generatedAt: new Date().toISOString(),
				source: '', // Invalid: should be non-empty
			},
			sections: [],
			items: [],
		};

		const valid = validate(invalidDomain);
		expect(valid).toBe(false);
		expect(validate.errors).toBeDefined();
	});
});
