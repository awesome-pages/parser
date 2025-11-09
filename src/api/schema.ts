import { z } from 'zod';
import type { Artifact } from './index';

export const ArtifactSchema = z.enum([
	'domain',
	'index',
	'bookmarks',
	'sitemap',
	'rss-json',
	'rss-xml',
]);
export type ArtifactZ = z.infer<typeof ArtifactSchema>;

export const OutputTargetSchema = z.object({
	artifact: z.union([ArtifactSchema, z.array(ArtifactSchema).min(1)]),
	to: z.string().min(1),
});

export const SourceSpecSchema = z.object({
	from: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
	outputs: z.array(OutputTargetSchema).min(1),
	strict: z.boolean().optional(),
});

export const ParseOptionsSchema = z.object({
	strict: z.boolean().optional(),
	concurrency: z.number().int().positive().max(128).default(8),
	githubToken: z.string().min(1).optional(),
	rootDir: z.string().min(1).optional(),
	cache: z.boolean().optional().default(true),
	cachePath: z.string().min(1).optional(),
	sources: z.array(SourceSpecSchema).min(1),
});

export type NormalizedOutput = {
	artifact: Artifact[];
	to: string;
};

export type NormalizedSource = {
	from: string[];
	outputs: NormalizedOutput[];
	strict?: boolean;
};

export type NormalizedOptions = {
	strict?: boolean;
	concurrency: number;
	githubToken?: string;
	rootDir: string;
	cache: boolean;
	cachePath: string;
	sources: NormalizedSource[];
};

export function parseAndNormalizeOptions(input: unknown): NormalizedOptions {
	const parsed = ParseOptionsSchema.parse(input);

	const rootDir = parsed.rootDir ?? process.cwd();
	const cachePath =
		parsed.cachePath ?? `${rootDir}/.awesome-pages/cache.v1.json`;

	return {
		strict: parsed.strict,
		concurrency: parsed.concurrency,
		githubToken: parsed.githubToken,
		rootDir,
		cache: parsed.cache,
		cachePath,
		sources: parsed.sources.map((s) => ({
			strict: s.strict,
			from: Array.isArray(s.from) ? s.from : [s.from],
			outputs: s.outputs.map((o) => ({
				artifact: Array.isArray(o.artifact) ? o.artifact : [o.artifact],
				to: o.to,
			})),
		})),
	};
}
