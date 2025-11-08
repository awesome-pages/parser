import type { DomainV1 } from '@/schemas/v1/domain.v1';

/**
 * Common feed view model used by both JSON Feed and RSS XML generators.
 * This intermediate representation makes it easier to maintain consistency
 * between the two feed formats.
 */
export interface FeedVM {
	title: string;
	description: string | null;
	homePageUrl: string | null;
	generatedAt: string;
	items: FeedItemVM[];
}

export interface FeedItemVM {
	id: string;
	url: string;
	title: string;
	description: string | null;
	publishedAt: string;
}

/**
 * Extracts the home page URL from the domain source.
 * Supports GitHub repo URLs in the format: github:owner/repo@ref:path or github://owner/repo@ref:path
 */
function extractHomePageUrl(source: string | null | undefined): string | null {
	if (!source) return null;

	// Match github:owner/repo@ref:path or github://owner/repo@ref:path
	const githubMatch = source.match(/^github:\/?\/?([^@]+)@/);
	if (githubMatch) {
		return `https://github.com/${githubMatch[1]}`;
	}

	// If it's already an HTTP(S) URL, return it
	if (source.startsWith('http://') || source.startsWith('https://')) {
		return source;
	}

	return null;
}

/**
 * Builds a feed view model from DomainV1.
 * This is the single source of truth for feed data used by both JSON Feed and RSS XML generators.
 *
 * @param domain - The parsed domain object
 * @returns A feed view model with all items that have valid URLs
 */
export function buildFeedVM(domain: DomainV1): FeedVM {
	const title = domain.meta.title || 'Awesome List';
	const description = domain.meta.description || null;
	const homePageUrl = extractHomePageUrl(domain.meta.source);
	const generatedAt = domain.meta.generatedAt;

	// Collect all items with valid URLs, flattened from all sections
	const items: FeedItemVM[] = [];

	for (const section of domain.sections) {
		const sectionItems = domain.items.filter(
			(item) => item.sectionId === section.id && item.url,
		);

		for (const item of sectionItems) {
			items.push({
				id: item.id,
				url: item.url!,
				title: item.title,
				description: item.description,
				publishedAt: generatedAt, // Use generation time as publish date
			});
		}
	}

	return {
		title,
		description,
		homePageUrl,
		generatedAt,
		items,
	};
}
