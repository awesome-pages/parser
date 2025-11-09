import type { DomainV1 } from '@/schemas/v1/domain.v1';
import { buildFeedVM } from './buildFeedVM';

/**
 * JSON Feed v1.1 format types
 * @see https://jsonfeed.org/version/1.1
 */
interface JsonFeed {
	version: string;
	title: string;
	home_page_url?: string;
	feed_url?: string;
	description?: string;
	items: JsonFeedItem[];
}

interface JsonFeedItem {
	id: string;
	url?: string;
	title?: string;
	content_text?: string;
	date_published?: string;
}

/**
 * Generates a JSON Feed v1.1 document from DomainV1.
 *
 * JSON Feed is a modern, JSON-based alternative to RSS/Atom feeds.
 * It's easier to parse and work with in JavaScript applications.
 *
 * @see https://jsonfeed.org/version/1.1
 * @param domain - The parsed domain object
 * @param feedUrl - Optional URL where this feed will be published
 * @returns JSON string in JSON Feed v1.1 format
 */
export function generateJsonFeed(domain: DomainV1, feedUrl?: string): string {
	const feed = buildFeedVM(domain);

	const jsonFeed: JsonFeed = {
		version: 'https://jsonfeed.org/version/1.1',
		title: feed.title,
		items: feed.items.map((item) => ({
			id: item.id,
			url: item.url,
			title: item.title,
			content_text: item.description || undefined,
			date_published: item.publishedAt,
		})),
	};

	// Add optional fields if they exist
	if (feed.homePageUrl) {
		jsonFeed.home_page_url = feed.homePageUrl;
	}

	if (feedUrl) {
		jsonFeed.feed_url = feedUrl;
	}

	if (feed.description) {
		jsonFeed.description = feed.description;
	}

	return JSON.stringify(jsonFeed, null, 2);
}
