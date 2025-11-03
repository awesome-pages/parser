import { describe, expect, it } from 'vitest';
import { buildPlaceholderContext } from './placeholderContext';

describe('buildPlaceholderContext', () => {
	describe('GitHub source', () => {
		it('parses github source with full path', () => {
			const result = buildPlaceholderContext({
				input: '',
				sourceId: 'github:awesome-pages/parser@main:docs/readme.md',
				rootDir: '/any',
			});

			expect(result).toEqual({
				dir: 'docs',
				name: 'readme',
				ext: 'md',
				owner: 'awesome-pages',
				repo: 'parser',
				ref: 'main',
				path: 'docs/readme.md',
			});
		});

	it('parses github source with nested path', () => {
		const result = buildPlaceholderContext({
			input: '',
			sourceId: 'github:user/repo@develop:src/api/file.json',
			rootDir: '/any',
		});

		expect(result).toEqual({
			dir: 'src-api',
			name: 'file',
			ext: 'json',
			owner: 'user',
			repo: 'repo',
			ref: 'develop',
			path: 'src/api/file.json',
		});
	});		it('parses github source with root file', () => {
			const result = buildPlaceholderContext({
				input: '',
				sourceId: 'github:owner/repository@master:README.md',
				rootDir: '/any',
			});

			expect(result).toEqual({
				dir: '',
				name: 'readme',
				ext: 'md',
				owner: 'owner',
				repo: 'repository',
				ref: 'master',
				path: 'README.md',
			});
		});

	it('slugifies github owner, repo and ref with special characters', () => {
		const result = buildPlaceholderContext({
			input: '',
			sourceId: 'github:My-Owner_123/My_Repo@feature/new-branch:docs/file.md',
			rootDir: '/any',
		});

		expect(result.owner).toBe('my-owner-123');
		expect(result.repo).toBe('my-repo');
		expect(result.ref).toBe('feature-new-branch');
	});		it('handles invalid github format with fallback', () => {
			const result = buildPlaceholderContext({
				input: '',
				sourceId: 'github:invalid-format',
				rootDir: '/any',
			});

			expect(result).toEqual({
				dir: '',
				name: 'readme',
				ext: 'md',
			});
		});

		it('handles github source without extension', () => {
			const result = buildPlaceholderContext({
				input: '',
				sourceId: 'github:owner/repo@main:LICENSE',
				rootDir: '/any',
			});

			expect(result).toEqual({
				dir: '',
				name: 'license',
				ext: '',
				owner: 'owner',
				repo: 'repo',
				ref: 'main',
				path: 'LICENSE',
			});
		});
	});

	describe('HTTP source', () => {
		it('parses http source with full URL', () => {
			const result = buildPlaceholderContext({
				input: '',
				sourceId: 'http:https://example.com/docs/guide.md',
				rootDir: '/any',
			});

			expect(result).toEqual({
				dir: 'docs',
				name: 'guide',
				ext: 'md',
			});
		});

	it('parses http source with nested path', () => {
		const result = buildPlaceholderContext({
			input: '',
			sourceId: 'http:https://api.example.com/v1/data/file.json',
			rootDir: '/any',
		});

		expect(result).toEqual({
			dir: 'v1-data',
			name: 'file',
			ext: 'json',
		});
	});		it('parses http source with root file', () => {
			const result = buildPlaceholderContext({
				input: '',
				sourceId: 'http:https://example.com/readme.txt',
				rootDir: '/any',
			});

			expect(result).toEqual({
				dir: '',
				name: 'readme',
				ext: 'txt',
			});
		});

		it('handles http source without path', () => {
			const result = buildPlaceholderContext({
				input: '',
				sourceId: 'http:https://example.com/',
				rootDir: '/any',
			});

			expect(result).toEqual({
				dir: '',
				name: 'index',
				ext: '',
			});
		});

		it('handles invalid http URL with fallback', () => {
			const result = buildPlaceholderContext({
				input: '',
				sourceId: 'http:not-a-valid-url',
				rootDir: '/any',
			});

			expect(result).toEqual({
				dir: '',
				name: 'index',
				ext: '',
			});
		});

		it('handles http source without extension', () => {
			const result = buildPlaceholderContext({
				input: '',
				sourceId: 'http:https://example.com/docs/LICENSE',
				rootDir: '/any',
			});

			expect(result).toEqual({
				dir: 'docs',
				name: 'license',
				ext: '',
			});
		});

		it('slugifies directory and filename from URL', () => {
		const result = buildPlaceholderContext({
			input: '',
			sourceId: 'http:https://example.com/My_Docs/Some%20File.md',
			rootDir: '/any',
		});

		expect(result.dir).toBe('my-docs');
		expect(result.name).toBe('some-20file');
		});
	});

	describe('Local file source', () => {
		it('parses relative local file', () => {
			const result = buildPlaceholderContext({
				input: 'docs/readme.md',
				sourceId: 'local',
				rootDir: '/home/user/project',
			});

			expect(result).toEqual({
				dir: 'docs',
				name: 'readme',
				ext: 'md',
			});
		});

		it('parses absolute local file', () => {
			const result = buildPlaceholderContext({
				input: '/home/user/project/src/file.ts',
				sourceId: 'local',
				rootDir: '/home/user/project',
			});

			expect(result).toEqual({
				dir: 'src',
				name: 'file',
				ext: 'ts',
			});
		});

	it('parses nested local file', () => {
		const result = buildPlaceholderContext({
			input: 'src/api/helpers/module.js',
			sourceId: 'local',
			rootDir: '/project',
		});

		expect(result).toEqual({
			dir: 'src-api-helpers',
			name: 'module',
			ext: 'js',
		});
	});		it('parses root level local file', () => {
			const result = buildPlaceholderContext({
				input: 'README.md',
				sourceId: 'local',
				rootDir: '/project',
			});

			expect(result).toEqual({
				dir: '',
				name: 'readme',
				ext: 'md',
			});
		});

		it('handles local file without extension', () => {
			const result = buildPlaceholderContext({
				input: 'LICENSE',
				sourceId: 'local',
				rootDir: '/project',
			});

			expect(result).toEqual({
				dir: '',
				name: 'license',
				ext: '',
			});
		});

		it('slugifies local directory and filename with special characters', () => {
			const result = buildPlaceholderContext({
				input: 'My Docs/Some_File.md',
				sourceId: 'local',
				rootDir: '/project',
			});

			expect(result.dir).toBe('my-docs');
			expect(result.name).toBe('some-file');
		});

		it('handles current directory file', () => {
			const result = buildPlaceholderContext({
				input: './file.txt',
				sourceId: 'local',
				rootDir: '/project',
			});

			expect(result).toEqual({
				dir: '',
				name: 'file',
				ext: 'txt',
			});
		});

		it('handles parent directory navigation', () => {
			const result = buildPlaceholderContext({
				input: '../docs/file.md',
				sourceId: 'local',
				rootDir: '/project/src',
			});

			expect(result.dir).toBe('docs');
			expect(result.name).toBe('file');
			expect(result.ext).toBe('md');
		});
	});

	describe('edge cases', () => {
		it('normalizes special characters in paths', () => {
			const result = buildPlaceholderContext({
				input: 'docs/My@File#2.md',
				sourceId: 'local',
				rootDir: '/project',
			});

			expect(result.name).toMatch(/^[a-z0-9/_.-]+$/);
		});

		it('handles empty input for local source', () => {
			const result = buildPlaceholderContext({
				input: '',
				sourceId: 'local',
				rootDir: '/project',
			});

			expect(result).toBeDefined();
			expect(result.ext).toBe('');
		});

		it('handles files with multiple dots in name', () => {
			const result = buildPlaceholderContext({
				input: 'file.test.spec.ts',
				sourceId: 'local',
				rootDir: '/project',
			});

			expect(result.name).toBe('file-test-spec');
			expect(result.ext).toBe('ts');
		});
	});
});
