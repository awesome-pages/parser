export class MarkdownSourceError extends Error {
	constructor(
		message: string,
		public code: string,
		public cause?: unknown,
	) {
		super(message);
		this.name = 'MarkdownSourceError';
	}
}

export class RawFetchError extends MarkdownSourceError {
	constructor(
		public status: number,
		public url: string,
		public body?: string,
	) {
		super(`RAW fetch failed (${status}) for ${url}`, 'RAW_FETCH_ERROR');
	}
}

export class PrivateRepoError extends MarkdownSourceError {
	constructor(public url: string) {
		super(`Private repository requires GITHUB_TOKEN: ${url}`, 'PRIVATE_REPO');
	}
}

export class NotFoundError extends MarkdownSourceError {
	constructor(public url: string) {
		super(`File not found on GitHub: ${url}`, 'NOT_FOUND');
	}
}

export class GitHubApiError extends MarkdownSourceError {
	constructor(
		public status: number,
		public url: string,
		public body?: string,
	) {
		super(`GitHub API ${status} for ${url}`, 'GITHUB_API_ERROR');
	}
}

export class GithubTokenResolutionError extends Error {
	constructor(
		public stage: string,
		message: string,
		public cause?: unknown,
	) {
		super(`Failed to resolve GitHub token during ${stage}: ${message}`);
		this.name = 'GithubTokenResolutionError';
	}
}

export class UnsupportedMimeTypeError extends MarkdownSourceError {
	constructor(
		public url: string,
		public contentType: string | null,
		public allowed: readonly string[],
	) {
		super(
			`Invalid content-type '${contentType ?? 'null'}' for ${url}. Allowed: ${allowed.join(', ')}`,
			'UNSUPPORTED_MIME',
		);
	}
}
