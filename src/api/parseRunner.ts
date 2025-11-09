import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { generateBookmarksHtml } from '@/api/artifacts/generateBookmarksHtml';
import { generateJsonFeed } from '@/api/artifacts/generateJsonFeed';
import { generateRssXml } from '@/api/artifacts/generateRssXml';
import { generateSitemap } from '@/api/artifacts/generateSitemap';
import { buildPlaceholderContext } from '@/api/helpers/placeholderContext';
import { renderTemplate } from '@/api/helpers/renderTemplate';
import { CacheManager, NoopCacheManager } from '@/cache/manager';
import { buildIndex } from '@/core/helpers/buildIndex';
import { mdastToDomain } from '@/core/mdastToDomain';
import { markdownToAst } from '@/core/parser';
import type { DomainV1 } from '@/schemas/v1/domain.v1';
import { createSource } from '@/sources/createSource';
import type { Artifact, ParseResultFile } from './index';
import type { NormalizedOptions } from './schema';

export async function runParse(
	opts: NormalizedOptions,
): Promise<ParseResultFile[]> {
	const results: ParseResultFile[] = [];

	// Load cache if enabled
	const cache = opts.cache
		? await CacheManager.load(opts.cachePath)
		: new NoopCacheManager();

	try {
		for (const spec of opts.sources) {
			const strict = spec.strict ?? opts.strict ?? false;

			for (const from of spec.from) {
				const isHttp = /^https?:\/\//i.test(from);
				const isGithub = /^github:\/\//i.test(from);
				const isLocal = !isHttp && !isGithub;

				let inputs: string[] = [];

				if (isLocal) {
					const hasGlob = /[*?[\]{},]/.test(from);
					if (hasGlob) {
						const matches = await fg(from, {
							cwd: opts.rootDir,
							absolute: true,
						});
						inputs = matches;
					} else {
						const abs = path.isAbsolute(from)
							? from
							: path.join(opts.rootDir, from);
						inputs = [abs];
					}
				} else {
					inputs = [from];
				}

				for (const input of inputs) {
					const source = createSource(input, { githubToken: opts.githubToken });
					const markdown = await source.read(cache);
					const sourceId = source.id();

					const {
						tree,
						title,
						description,
						descriptionHtml,
						frontmatter,
						language,
					} = await markdownToAst(markdown, sourceId);

					const domain: DomainV1 = mdastToDomain(tree, {
						title,
						description,
						descriptionHtml,
						frontmatter,
						language,
						generatedAt: new Date().toISOString(),
						source: sourceId,
						strict,
					});

					const baseCtx = buildPlaceholderContext({
						input,
						sourceId,
						rootDir: opts.rootDir,
					});

					for (const out of spec.outputs) {
						for (const artifact of out.artifact) {
							const content = await emitArtifact(artifact, domain, sourceId);
							const rendered = renderTemplate(out.to, {
								...baseCtx,
								artifact,
							});

							const finalPath = path.isAbsolute(rendered)
								? rendered
								: path.join(opts.rootDir, rendered);

							await fs.mkdir(path.dirname(finalPath), { recursive: true });
							await fs.writeFile(finalPath, content, 'utf8');

							results.push({
								file: finalPath,
								artifact,
								sourceId,
								bytes: Buffer.byteLength(content, 'utf8'),
							});
						}
					}
				}
			}
		}
	} finally {
		// Always save cache at the end (even if there were errors)
		if (opts.cache) {
			await cache.save();
		}
	}

	return results;
}

async function emitArtifact(
	artifact: Artifact,
	domain: DomainV1,
	sourceId: string,
): Promise<string> {
	switch (artifact) {
		case 'domain':
			return JSON.stringify(domain, null, 2);
		case 'index':
			return JSON.stringify(buildIndex(domain), null, 2);
		case 'bookmarks':
			return generateBookmarksHtml(domain);
		case 'sitemap':
			return generateSitemap(domain);
		case 'rss-json':
			return generateJsonFeed(domain);
		case 'rss-xml':
			return generateRssXml(domain);
	}
}
