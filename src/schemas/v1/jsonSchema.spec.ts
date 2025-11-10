import { describe, expect, it } from 'vitest';
import { generateDomainV1JsonSchema } from './jsonSchema';

describe('generateDomainV1JsonSchema', () => {
	it('should generate valid JSON Schema from DomainV1Base', () => {
		const schema = generateDomainV1JsonSchema() as any;

		expect(schema).toBeDefined();
		expect(schema.$ref).toBe('#/definitions/awesome-pages-domain.v1');
		expect(schema.definitions).toBeDefined();

		const domainSchema = schema.definitions?.['awesome-pages-domain.v1'];
		expect(domainSchema.type).toBe('object');
		expect(domainSchema.properties).toHaveProperty('$schema');
		expect(domainSchema.properties).toHaveProperty('schemaVersion');
		expect(domainSchema.properties).toHaveProperty('meta');
		expect(domainSchema.properties).toHaveProperty('sections');
		expect(domainSchema.properties).toHaveProperty('items');
	});

	it('should include section structure', () => {
		const schema = generateDomainV1JsonSchema() as any;
		const domainSchema = schema.definitions?.['awesome-pages-domain.v1'];
		const sectionsSchema = domainSchema.properties?.sections;

		expect(sectionsSchema).toBeDefined();
		expect(sectionsSchema.type).toBe('array');
		expect(sectionsSchema.items?.properties).toHaveProperty('id');
		expect(sectionsSchema.items?.properties).toHaveProperty('title');
		expect(sectionsSchema.items?.properties).toHaveProperty('path');
	});

	it('should include item structure', () => {
		const schema = generateDomainV1JsonSchema() as any;
		const domainSchema = schema.definitions?.['awesome-pages-domain.v1'];
		const itemsSchema = domainSchema.properties?.items;

		expect(itemsSchema).toBeDefined();
		expect(itemsSchema.type).toBe('array');
		expect(itemsSchema.items?.properties).toHaveProperty('id');
		expect(itemsSchema.items?.properties).toHaveProperty('sectionId');
		expect(itemsSchema.items?.properties).toHaveProperty('tags');
	});
});
