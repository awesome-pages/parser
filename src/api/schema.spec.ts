import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
	ArtifactSchema,
	OutputTargetSchema,
	SourceSpecSchema,
	ParseOptionsSchema,
	parseAndNormalizeOptions,
} from './schema';

describe('ArtifactSchema', () => {
	it('accepts valid artifact types', () => {
		expect(() => ArtifactSchema.parse('domain')).not.toThrow();
		expect(() => ArtifactSchema.parse('index')).not.toThrow();
		expect(() => ArtifactSchema.parse('bookmarks')).not.toThrow();
	});

	it('rejects invalid artifact types', () => {
		expect(() => ArtifactSchema.parse('invalid')).toThrow(z.ZodError);
		expect(() => ArtifactSchema.parse('')).toThrow(z.ZodError);
		expect(() => ArtifactSchema.parse(123)).toThrow(z.ZodError);
		expect(() => ArtifactSchema.parse(null)).toThrow(z.ZodError);
	});
});

describe('OutputTargetSchema', () => {
	it('accepts single artifact and valid to path', () => {
		const result = OutputTargetSchema.parse({
			artifact: 'domain',
			to: 'output.json',
		});

		expect(result).toEqual({
			artifact: 'domain',
			to: 'output.json',
		});
	});

	it('accepts array of artifacts and valid to path', () => {
		const result = OutputTargetSchema.parse({
			artifact: ['domain', 'index'],
			to: 'output/path',
		});

		expect(result).toEqual({
			artifact: ['domain', 'index'],
			to: 'output/path',
		});
	});

	it('accepts array with all artifact types', () => {
		const result = OutputTargetSchema.parse({
			artifact: ['domain', 'index', 'bookmarks'],
			to: 'output.json',
		});

		expect(result.artifact).toHaveLength(3);
	});

	it('rejects empty to path', () => {
		expect(() =>
			OutputTargetSchema.parse({
				artifact: 'domain',
				to: '',
			})
		).toThrow(z.ZodError);
	});

	it('rejects empty artifact array', () => {
		expect(() =>
			OutputTargetSchema.parse({
				artifact: [],
				to: 'output.json',
			})
		).toThrow(z.ZodError);
	});

	it('rejects missing to field', () => {
		expect(() =>
			OutputTargetSchema.parse({
				artifact: 'domain',
			})
		).toThrow(z.ZodError);
	});

	it('rejects missing artifact field', () => {
		expect(() =>
			OutputTargetSchema.parse({
				to: 'output.json',
			})
		).toThrow(z.ZodError);
	});
});

describe('SourceSpecSchema', () => {
	it('accepts single from string with outputs', () => {
		const result = SourceSpecSchema.parse({
			from: 'README.md',
			outputs: [
				{
					artifact: 'domain',
					to: 'output.json',
				},
			],
		});

		expect(result).toEqual({
			from: 'README.md',
			outputs: [
				{
					artifact: 'domain',
					to: 'output.json',
				},
			],
		});
	});

	it('accepts array of from strings', () => {
		const result = SourceSpecSchema.parse({
			from: ['README.md', 'DOCS.md'],
			outputs: [
				{
					artifact: 'domain',
					to: 'output.json',
				},
			],
		});

		expect(result.from).toEqual(['README.md', 'DOCS.md']);
	});

	it('accepts multiple outputs', () => {
		const result = SourceSpecSchema.parse({
			from: 'README.md',
			outputs: [
				{
					artifact: 'domain',
					to: 'output1.json',
				},
				{
					artifact: ['index', 'bookmarks'],
					to: 'output2.json',
				},
			],
		});

		expect(result.outputs).toHaveLength(2);
	});

	it('accepts optional strict field as true', () => {
		const result = SourceSpecSchema.parse({
			from: 'README.md',
			outputs: [
				{
					artifact: 'domain',
					to: 'output.json',
				},
			],
			strict: true,
		});

		expect(result.strict).toBe(true);
	});

	it('accepts optional strict field as false', () => {
		const result = SourceSpecSchema.parse({
			from: 'README.md',
			outputs: [
				{
					artifact: 'domain',
					to: 'output.json',
				},
			],
			strict: false,
		});

		expect(result.strict).toBe(false);
	});

	it('accepts source without strict field', () => {
		const result = SourceSpecSchema.parse({
			from: 'README.md',
			outputs: [
				{
					artifact: 'domain',
					to: 'output.json',
				},
			],
		});

		expect(result.strict).toBeUndefined();
	});

	it('rejects empty from string', () => {
		expect(() =>
			SourceSpecSchema.parse({
				from: '',
				outputs: [
					{
						artifact: 'domain',
						to: 'output.json',
					},
				],
			})
		).toThrow(z.ZodError);
	});

	it('rejects empty from array', () => {
		expect(() =>
			SourceSpecSchema.parse({
				from: [],
				outputs: [
					{
						artifact: 'domain',
						to: 'output.json',
					},
				],
			})
		).toThrow(z.ZodError);
	});

	it('rejects empty outputs array', () => {
		expect(() =>
			SourceSpecSchema.parse({
				from: 'README.md',
				outputs: [],
			})
		).toThrow(z.ZodError);
	});

	it('rejects missing from field', () => {
		expect(() =>
			SourceSpecSchema.parse({
				outputs: [
					{
						artifact: 'domain',
						to: 'output.json',
					},
				],
			})
		).toThrow(z.ZodError);
	});

	it('rejects missing outputs field', () => {
		expect(() =>
			SourceSpecSchema.parse({
				from: 'README.md',
			})
		).toThrow(z.ZodError);
	});
});

describe('ParseOptionsSchema', () => {
	it('accepts minimal valid options', () => {
		const result = ParseOptionsSchema.parse({
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.sources).toHaveLength(1);
		expect(result.concurrency).toBe(8); // default value
	});

	it('accepts all optional fields', () => {
		const result = ParseOptionsSchema.parse({
			strict: true,
			concurrency: 16,
			githubToken: 'ghp_token123',
			rootDir: '/project',
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.strict).toBe(true);
		expect(result.concurrency).toBe(16);
		expect(result.githubToken).toBe('ghp_token123');
		expect(result.rootDir).toBe('/project');
	});

	it('accepts multiple sources', () => {
		const result = ParseOptionsSchema.parse({
			sources: [
				{
					from: 'README.md',
					outputs: [{ artifact: 'domain', to: 'output1.json' }],
				},
				{
					from: 'DOCS.md',
					outputs: [{ artifact: 'index', to: 'output2.json' }],
				},
			],
		});

		expect(result.sources).toHaveLength(2);
	});

	it('applies default concurrency value of 8', () => {
		const result = ParseOptionsSchema.parse({
			sources: [
				{
					from: 'README.md',
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		});

		expect(result.concurrency).toBe(8);
	});

	it('accepts concurrency of 1', () => {
		const result = ParseOptionsSchema.parse({
			concurrency: 1,
			sources: [
				{
					from: 'README.md',
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		});

		expect(result.concurrency).toBe(1);
	});

	it('accepts maximum concurrency of 128', () => {
		const result = ParseOptionsSchema.parse({
			concurrency: 128,
			sources: [
				{
					from: 'README.md',
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		});

		expect(result.concurrency).toBe(128);
	});

	it('rejects concurrency of 0', () => {
		expect(() =>
			ParseOptionsSchema.parse({
				concurrency: 0,
				sources: [
					{
						from: 'README.md',
						outputs: [{ artifact: 'domain', to: 'output.json' }],
					},
				],
			})
		).toThrow(z.ZodError);
	});

	it('rejects negative concurrency', () => {
		expect(() =>
			ParseOptionsSchema.parse({
				concurrency: -5,
				sources: [
					{
						from: 'README.md',
						outputs: [{ artifact: 'domain', to: 'output.json' }],
					},
				],
			})
		).toThrow(z.ZodError);
	});

	it('rejects concurrency greater than 128', () => {
		expect(() =>
			ParseOptionsSchema.parse({
				concurrency: 129,
				sources: [
					{
						from: 'README.md',
						outputs: [{ artifact: 'domain', to: 'output.json' }],
					},
				],
			})
		).toThrow(z.ZodError);
	});

	it('rejects non-integer concurrency', () => {
		expect(() =>
			ParseOptionsSchema.parse({
				concurrency: 8.5,
				sources: [
					{
						from: 'README.md',
						outputs: [{ artifact: 'domain', to: 'output.json' }],
					},
				],
			})
		).toThrow(z.ZodError);
	});

	it('rejects empty githubToken', () => {
		expect(() =>
			ParseOptionsSchema.parse({
				githubToken: '',
				sources: [
					{
						from: 'README.md',
						outputs: [{ artifact: 'domain', to: 'output.json' }],
					},
				],
			})
		).toThrow(z.ZodError);
	});

	it('rejects empty rootDir', () => {
		expect(() =>
			ParseOptionsSchema.parse({
				rootDir: '',
				sources: [
					{
						from: 'README.md',
						outputs: [{ artifact: 'domain', to: 'output.json' }],
					},
				],
			})
		).toThrow(z.ZodError);
	});

	it('rejects empty sources array', () => {
		expect(() =>
			ParseOptionsSchema.parse({
				sources: [],
			})
		).toThrow(z.ZodError);
	});

	it('rejects missing sources field', () => {
		expect(() => ParseOptionsSchema.parse({})).toThrow(z.ZodError);
	});
});

describe('parseAndNormalizeOptions', () => {
	it('normalizes single artifact to array', () => {
		const result = parseAndNormalizeOptions({
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.sources[0].outputs[0].artifact).toEqual(['domain']);
	});

	it('preserves artifact array', () => {
		const result = parseAndNormalizeOptions({
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: ['domain', 'index'],
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.sources[0].outputs[0].artifact).toEqual(['domain', 'index']);
	});

	it('normalizes single from to array', () => {
		const result = parseAndNormalizeOptions({
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.sources[0].from).toEqual(['README.md']);
	});

	it('preserves from array', () => {
		const result = parseAndNormalizeOptions({
			sources: [
				{
					from: ['README.md', 'DOCS.md'],
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.sources[0].from).toEqual(['README.md', 'DOCS.md']);
	});

	it('uses process.cwd() as default rootDir', () => {
		const result = parseAndNormalizeOptions({
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.rootDir).toBe(process.cwd());
	});

	it('preserves provided rootDir', () => {
		const result = parseAndNormalizeOptions({
			rootDir: '/custom/path',
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.rootDir).toBe('/custom/path');
	});

	it('preserves strict field at root level', () => {
		const result = parseAndNormalizeOptions({
			strict: true,
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.strict).toBe(true);
	});

	it('preserves strict field at source level', () => {
		const result = parseAndNormalizeOptions({
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
					strict: false,
				},
			],
		});

		expect(result.sources[0].strict).toBe(false);
	});

	it('preserves concurrency value', () => {
		const result = parseAndNormalizeOptions({
			concurrency: 16,
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.concurrency).toBe(16);
	});

	it('applies default concurrency of 8', () => {
		const result = parseAndNormalizeOptions({
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.concurrency).toBe(8);
	});

	it('preserves githubToken', () => {
		const result = parseAndNormalizeOptions({
			githubToken: 'ghp_token123',
			sources: [
				{
					from: 'README.md',
					outputs: [
						{
							artifact: 'domain',
							to: 'output.json',
						},
					],
				},
			],
		});

		expect(result.githubToken).toBe('ghp_token123');
	});

	it('normalizes multiple sources', () => {
		const result = parseAndNormalizeOptions({
			sources: [
				{
					from: 'README.md',
					outputs: [{ artifact: 'domain', to: 'output1.json' }],
				},
				{
					from: ['DOCS.md', 'GUIDE.md'],
					outputs: [{ artifact: ['index', 'bookmarks'], to: 'output2.json' }],
				},
			],
		});

		expect(result.sources).toHaveLength(2);
		expect(result.sources[0].from).toEqual(['README.md']);
		expect(result.sources[1].from).toEqual(['DOCS.md', 'GUIDE.md']);
	});

	it('normalizes multiple outputs per source', () => {
		const result = parseAndNormalizeOptions({
			sources: [
				{
					from: 'README.md',
					outputs: [
						{ artifact: 'domain', to: 'output1.json' },
						{ artifact: ['index', 'bookmarks'], to: 'output2.json' },
					],
				},
			],
		});

		expect(result.sources[0].outputs).toHaveLength(2);
		expect(result.sources[0].outputs[0].artifact).toEqual(['domain']);
		expect(result.sources[0].outputs[1].artifact).toEqual(['index', 'bookmarks']);
	});

	it('handles complex nested structure', () => {
		const result = parseAndNormalizeOptions({
			strict: true,
			concurrency: 32,
			githubToken: 'token',
			rootDir: '/project',
			sources: [
				{
					from: ['README.md', 'DOCS.md'],
					outputs: [
						{ artifact: ['domain', 'index'], to: 'output1.json' },
						{ artifact: 'bookmarks', to: 'output2.json' },
					],
					strict: false,
				},
				{
					from: 'GUIDE.md',
					outputs: [{ artifact: 'domain', to: 'output3.json' }],
				},
			],
		});

		expect(result.strict).toBe(true);
		expect(result.concurrency).toBe(32);
		expect(result.githubToken).toBe('token');
		expect(result.rootDir).toBe('/project');
		expect(result.sources).toHaveLength(2);
		expect(result.sources[0].from).toEqual(['README.md', 'DOCS.md']);
		expect(result.sources[0].strict).toBe(false);
		expect(result.sources[1].from).toEqual(['GUIDE.md']);
		expect(result.sources[1].strict).toBeUndefined();
	});

	it('throws on invalid input', () => {
		expect(() => parseAndNormalizeOptions(null)).toThrow();
		expect(() => parseAndNormalizeOptions({})).toThrow();
		expect(() => parseAndNormalizeOptions({ sources: [] })).toThrow();
	});
});
