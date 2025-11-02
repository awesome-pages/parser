import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We will mock child_process BEFORE importing the module under test in tests that need it

const ORIG_ENV = process.env;

// Helper to (re)import the module under test with a fresh module cache
async function importResolver() {
  const mod = await import('@/sources/resolveGithubToken');
  return mod as typeof import('@/sources/resolveGithubToken');
}

function cleanEnv() {
  // reset env to a shallow clone to avoid leaking variables across tests
  process.env = { ...ORIG_ENV };
  delete process.env.GITHUB_TOKEN;
  delete process.env.GH_TOKEN;
  // also remove potential namespaced ones used by tests
  delete (process.env as Record<string, string | undefined>)[
    'GITHUB_TOKEN_GITHUB_COM_FOO_BAR'
  ];
  delete (process.env as Record<string, string | undefined>)[
    'GITHUB_TOKEN_FOO_BAR'
  ];
}

describe('resolveGithubToken (env precedence)', () => {
  beforeEach(() => {
    vi.resetModules();
    cleanEnv();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns namespaced env var (host+owner+repo) when present', async () => {
    process.env.GITHUB_TOKEN_GITHUB_COM_FOO_BAR = 'ns-token-1';

    const { resolveGithubToken } = await importResolver();
    const tok = await resolveGithubToken({
      host: 'github.com',
      owner: 'foo',
      repo: 'bar',
    });

    expect(tok).toBe('ns-token-1');
  });

  it('falls back to owner+repo env when host+owner+repo is absent', async () => {
    process.env.GITHUB_TOKEN_FOO_BAR = 'ns-token-2';

    const { resolveGithubToken } = await importResolver();
    const tok = await resolveGithubToken({
      host: 'github.com',
      owner: 'foo',
      repo: 'bar',
    });

    expect(tok).toBe('ns-token-2');
  });

  it('falls back to generic GITHUB_TOKEN', async () => {
    process.env.GITHUB_TOKEN = 'generic-token';

    const { resolveGithubToken } = await importResolver();
    const tok = await resolveGithubToken({
      host: 'github.com',
      owner: 'foo',
      repo: 'bar',
    });

    expect(tok).toBe('generic-token');
  });

  it('falls back to GH_TOKEN when GITHUB_TOKEN is not set', async () => {
    process.env.GH_TOKEN = 'gh-token';

    const { resolveGithubToken } = await importResolver();
    const tok = await resolveGithubToken({
      host: 'github.com',
      owner: 'foo',
      repo: 'bar',
    });

    expect(tok).toBe('gh-token');
  });
});

describe('resolveGithubToken (GH CLI fallback)', () => {
  beforeEach(() => {
    vi.resetModules();
    cleanEnv();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses `gh auth token` when no env tokens are set', async () => {
    // mock child_process.execFile to simulate gh returning a token
    vi.doMock('node:child_process', async () => {
      const { promisify } = await import('node:util');
      const execFile = (
        file: string,
        args: string[],
        cb: (
          err: unknown,
          stdout: { toString(): string },
          stderr: unknown
        ) => void
      ) => {
        // assert we are calling gh auth token
        expect(file).toBe('gh');
        expect(args).toEqual(['auth', 'token']);
        cb(null, { toString: () => 'cli-token\n' }, null);
        return {} as unknown as import('node:child_process').ChildProcess;
      };
      // Make execFile work with promisify by adding the custom promisify symbol
      (execFile as typeof execFile & Record<symbol, unknown>)[
        promisify.custom
      ] = async (file: string, args: string[]) => {
        expect(file).toBe('gh');
        expect(args).toEqual(['auth', 'token']);
        return { stdout: 'cli-token\n', stderr: '' };
      };
      return {
        execFile,
      };
    });

    const { resolveGithubToken } = await importResolver();
    const tok = await resolveGithubToken({
      host: 'github.com',
      owner: 'foo',
      repo: 'bar',
    });

    expect(tok).toBe('cli-token');
  });

  it('throws GithubTokenResolutionError when gh CLI invocation fails', async () => {
    vi.doMock('node:child_process', () => {
      return {
        execFile: (
          _file: string,
          _args: string[],
          cb: (err: unknown, stdout: unknown, stderr: unknown) => void
        ) => {
          cb(
            new Error('gh not installed'),
            null as unknown as import('node:child_process').ChildProcess['stdout'],
            null as unknown as import('node:child_process').ChildProcess['stderr']
          );
          return {} as unknown as import('node:child_process').ChildProcess;
        },
      };
    });

    const { resolveGithubToken } = await importResolver();
    const { GithubTokenResolutionError } = await import('@/sources/errors');

    await expect(
      resolveGithubToken({ host: 'github.com', owner: 'foo', repo: 'bar' })
    ).rejects.toBeInstanceOf(GithubTokenResolutionError);
  });

  it('returns undefined when gh CLI returns empty output', async () => {
    vi.doMock('node:child_process', () => {
      return {
        execFile: (
          _file: string,
          _args: string[],
          cb: (
            err: unknown,
            stdout: { toString(): string },
            stderr: unknown
          ) => void
        ) => {
          cb(null, { toString: () => '' }, null);
          return {} as unknown as import('node:child_process').ChildProcess;
        },
      };
    });

    const { resolveGithubToken } = await importResolver();
    const tok = await resolveGithubToken({
      host: 'github.com',
      owner: 'foo',
      repo: 'bar',
    });

    expect(tok).toBeUndefined();
  });
});
