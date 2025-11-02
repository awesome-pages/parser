import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import {
	GitHubApiError,
	NotFoundError,
	PrivateRepoError,
	RawFetchError,
} from '@/sources/errors';
import { GitHubContentsApiSource } from '@/sources/githubContents';
import { server } from '@/tests/server';

// Always avoid hitting gh CLI/token discovery during tests
vi.mock('@/sources/resolveGithubToken', () => ({
	resolveGithubToken: vi.fn(async () => undefined),
}));

// Helper to b64-encode API payloads
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

// Default coordinates used across tests
const owner = 'teles';
const repo = 'awesome-click-and-use';
const ref = 'main';
const filePath = 'README.md';

// NOTE: We rely on baseline handlers declared in
// `src/sources/__mocks__/github.handlers.ts` for the common cases.
// For scenario-specific behaviors, we override with `server.use(...)`.

describe('GitHubContentsApiSource + MSW', () => {
	it('reads via RAW when no token (public repo, raw-first)', async () => {
		// Baseline handler already returns a 200 RAW body for this route
		const src = new GitHubContentsApiSource(owner, repo, ref, filePath);
		const md = await src.read();
		expect(md).toContain('# Awesome Click and Use');
	});

	it('falls back to Contents API after RAW 404 and decodes base64 body', async () => {
		server.use(
			// Force RAW 404
			http.get(
				`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`,
				() => HttpResponse.text('raw not found', { status: 404 }),
			),
			// API 200 with base64 content
			http.get(
				`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
				({ request }) => {
					const url = new URL(request.url);
					const qref = url.searchParams.get('ref');
					if (qref !== ref)
						return HttpResponse.text('Not Found', { status: 404 });
					return HttpResponse.json(
						{ content: b64('Hello'), encoding: 'base64' },
						{ status: 200 },
					);
				},
			),
		);

		const src = new GitHubContentsApiSource(owner, repo, ref, filePath);
		const md = await src.read();
		expect(md).toBe('Hello');
	});

	it('throws RawFetchError when RAW fails with 5xx', async () => {
		server.use(
			http.get(
				`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`,
				() => HttpResponse.text('server error', { status: 500 }),
			),
		);

		const src = new GitHubContentsApiSource(owner, repo, ref, filePath);
		await expect(src.read()).rejects.toBeInstanceOf(RawFetchError);
	});

	it('throws PrivateRepoError when RAW 403 and API 403 (no token)', async () => {
		server.use(
			http.get(
				`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`,
				() => HttpResponse.text('forbidden', { status: 403 }),
			),
			http.get(
				`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
				() => HttpResponse.text('forbidden api', { status: 403 }),
			),
		);

		const src = new GitHubContentsApiSource(owner, repo, ref, filePath);
		await expect(src.read()).rejects.toBeInstanceOf(PrivateRepoError);
	});

	it('throws NotFoundError when RAW 404 and API 404 (no token)', async () => {
		server.use(
			http.get(
				`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`,
				() => HttpResponse.text('raw 404', { status: 404 }),
			),
			http.get(
				`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
				() => HttpResponse.text('api 404', { status: 404 }),
			),
		);

		const src = new GitHubContentsApiSource(owner, repo, ref, filePath);
		await expect(src.read()).rejects.toBeInstanceOf(NotFoundError);
	});

	it('uses Contents API directly when token is provided and decodes base64', async () => {
		// Force API 200 with token
		server.use(
			http.get(
				`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
				({ request }) => {
					const auth = request.headers.get('authorization');
					if (!auth) return HttpResponse.text('missing auth', { status: 403 });
					const url = new URL(request.url);
					if (url.searchParams.get('ref') !== ref)
						return HttpResponse.text('Not Found', { status: 404 });
					return HttpResponse.json(
						{ content: b64('With token'), encoding: 'base64' },
						{ status: 200 },
					);
				},
			),
		);

		const src = new GitHubContentsApiSource(
			owner,
			repo,
			ref,
			filePath,
			'ghp_FAKE',
		);
		const md = await src.read();
		expect(md).toBe('With token');
	});

	it('throws GitHubApiError when API fails and no RAW hint was present (token case)', async () => {
		server.use(
			http.get(
				`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
				() => HttpResponse.text('api down', { status: 500 }),
			),
		);

		const src = new GitHubContentsApiSource(
			owner,
			repo,
			ref,
			filePath,
			'ghp_FAKE',
		);
		await expect(src.read()).rejects.toBeInstanceOf(GitHubApiError);
	});
});
