import { GitHubContentsApiSource } from '@/sources/githubContents';
import { HttpRawSource } from '@/sources/httpRawSource';
import { LocalFileSource } from '@/sources/localFile';
import type { MarkdownSource } from '@/sources/types';

export interface CreateSourceOpts {
	githubToken?: string;
}

export function createSource(
	input: string,
	opts: CreateSourceOpts = {},
): MarkdownSource {
	// github://owner/repo@ref:path
	const m = input.match(/^github:\/\/([^/]+)\/([^@]+)@([^:]+):(.+)$/);
	if (m) {
		const [, owner, repo, ref, filePath] = m;
		return new GitHubContentsApiSource(
			owner,
			repo,
			ref,
			filePath,
			opts.githubToken,
		);
	}
	if (/^https?:\/\//i.test(input)) {
		console.log('Creating HttpRawSource for', input);
		return new HttpRawSource(input);
	}

	return new LocalFileSource(input);
}
