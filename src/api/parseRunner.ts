import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { buildPlaceholderContext } from '@/api/helpers/placeholderContext';
import { renderTemplate } from '@/api/helpers/renderTemplate';
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
					const matches = await fg(from, { cwd: opts.rootDir, absolute: true });
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
				const markdown = await source.read();
				const sourceId = source.id();

				const { tree, title, description, frontmatter } = await markdownToAst(
					markdown,
					sourceId,
				);

				const domain: DomainV1 = mdastToDomain(tree, {
					title,
					description,
					frontmatter,
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
			// TODO: implement a real index builder
			return JSON.stringify(
				{ schemaVersion: 1, docs: [] as unknown[] },
				null,
				2,
			);
		case 'bookmarks':
			// TODO: real bookmarks HTML
			return `<!-- bookmarks for ${sourceId} -->\n`;
	}
}
