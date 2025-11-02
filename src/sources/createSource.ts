import { GitHubContentsApiSource } from '@/sources/githubContents';
import { LocalFileSource } from '@/sources/localFile';
import type { MarkdownSource } from '@/sources/types';

export interface CreateSourceOpts {
  githubToken?: string;
}

export function createSource(
  input: string,
  opts: CreateSourceOpts = {}
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
      opts.githubToken
    );
  }

  return new LocalFileSource(input);
}
