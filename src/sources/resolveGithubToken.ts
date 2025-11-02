import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { slugifyEnv } from '@/sources/helpers/slugifyEnv.js';
import { GithubTokenResolutionError } from '@/sources/errors';

const execFileAsync = promisify(execFile);

export interface RepoRef {
  host: string;
  owner: string;
  repo: string;
}

/**
 * Resolve GitHub token in a secure, minimal way:
 * 1) Namespaced env vars: GITHUB_TOKEN_<HOST>_<OWNER>_<REPO>
 * 2) Env generic: GITHUB_TOKEN, GH_TOKEN
 * 3) Optional fallback to GH CLI: `gh auth token`
 * If nothing resolves, returns undefined (allowing public/anonymous flows).
 */
export async function resolveGithubToken(
  ref: RepoRef
): Promise<string | undefined> {
  const hostU = slugifyEnv(ref.host);
  const ownerU = slugifyEnv(ref.owner);
  const repoU = slugifyEnv(ref.repo);

  // 1) Namespaced env (host + owner + repo) → most specific
  const candidates = [
    `GITHUB_TOKEN_${hostU}_${ownerU}_${repoU}`,
    `GITHUB_TOKEN_${ownerU}_${repoU}`, // assumes github.com
    process.env.GITHUB_TOKEN ? 'GITHUB_TOKEN' : undefined,
    process.env.GH_TOKEN ? 'GH_TOKEN' : undefined,
  ].filter(Boolean) as string[];

  for (const k of candidates) {
    const v = process.env[k];
    if (v) return v;
  }

  // 2) Optional GH CLI fallback (silent): try `gh auth token`
  try {
    const { stdout } = await execFileAsync('gh', ['auth', 'token']);
    const tok = stdout?.toString().trim();
    if (tok) return tok;
    // If gh CLI returns empty output, return undefined
    return undefined;
  } catch (err) {
    // Check if it's ENOENT (gh not found) - in that case, silently return undefined
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      err.code === 'ENOENT'
    ) {
      return undefined;
    }
    // For other errors (gh exists but fails), throw a typed error
    throw new GithubTokenResolutionError(
      'gh-cli',
      'Failed to invoke GitHub CLI (gh auth token)',
      err
    );
  }
}
