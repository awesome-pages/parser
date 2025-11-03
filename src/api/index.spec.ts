import { describe, expect, it, vi, beforeEach } from 'vitest';
import { parse } from './index';
import type { ParseOptions } from './index';

// Mock the dependencies before importing
vi.mock('./schema', () => ({
	parseAndNormalizeOptions: vi.fn(),
}));

vi.mock('./parseRunner', () => ({
	runParse: vi.fn(),
}));

// Import after mocking
const schema = await import('./schema');
const parseRunner = await import('./parseRunner');

describe('parse', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('calls parseAndNormalizeOptions and runParse in sequence', async () => {
		const mockOptions: ParseOptions = {
			sources: [
				{
					from: 'README.md',
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		};

		const mockNormalized: any = { concurrency: 8, sources: [], rootDir: '/test' };
		const mockResults: any[] = [];

		vi.mocked(schema.parseAndNormalizeOptions).mockReturnValue(mockNormalized);
		vi.mocked(parseRunner.runParse).mockResolvedValue(mockResults);

		await parse(mockOptions);

		expect(schema.parseAndNormalizeOptions).toHaveBeenCalledWith(mockOptions);
		expect(parseRunner.runParse).toHaveBeenCalledWith(mockNormalized);
	});

	it('returns the results from runParse', async () => {
		const mockOptions: ParseOptions = {
			sources: [
				{
					from: 'README.md',
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		};

		const mockNormalized: any = { concurrency: 8, sources: [], rootDir: '/test' };
		const mockResults: any[] = [
			{ file: 'output.json', artifact: 'domain', sourceId: 'test', bytes: 100 },
		];

		vi.mocked(schema.parseAndNormalizeOptions).mockReturnValue(mockNormalized);
		vi.mocked(parseRunner.runParse).mockResolvedValue(mockResults);

		const result = await parse(mockOptions);

		expect(result).toEqual(mockResults);
	});

	it('propagates errors from parseAndNormalizeOptions', async () => {
		const mockOptions: ParseOptions = {
			sources: [],
		};

		vi.mocked(schema.parseAndNormalizeOptions).mockImplementation(() => {
			throw new Error('Invalid options');
		});

		await expect(parse(mockOptions)).rejects.toThrow('Invalid options');
	});

	it('propagates errors from runParse', async () => {
		const mockOptions: ParseOptions = {
			sources: [
				{
					from: 'README.md',
					outputs: [{ artifact: 'domain', to: 'output.json' }],
				},
			],
		};

		const mockNormalized: any = { concurrency: 8, sources: [], rootDir: '/test' };

		vi.mocked(schema.parseAndNormalizeOptions).mockReturnValue(mockNormalized);
		vi.mocked(parseRunner.runParse).mockRejectedValue(
new Error('Parse failed')
);

		await expect(parse(mockOptions)).rejects.toThrow('Parse failed');
	});
});
