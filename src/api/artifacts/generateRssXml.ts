import type { DomainV1 } from '@/schemas/v1/domain.v1';
import { buildFeedVM } from './buildFeedVM';

/**
 * Escapes XML special characters to prevent XML injection and ensure valid XML output.
 */
function escapeXml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Formats an ISO 8601 date string to RFC 822 format required by RSS 2.0.
 * Example: "2025-11-08T12:00:00.000Z" → "Fri, 08 Nov 2025 12:00:00 GMT"
 */
function formatRfc822Date(isoDate: string): string {
	const date = new Date(isoDate);
	return date.toUTCString();
}

/**
 * Generates an RSS 2.0 XML feed from DomainV1.
 *
 * RSS 2.0 is the classic, widely-supported feed format used by
 * feed readers like Feedly, Inoreader, and Thunderbird.
 *
 * @see https://www.rssboard.org/rss-specification
 * @param domain - The parsed domain object
 * @returns RSS 2.0 XML string
 */
export function generateRssXml(domain: DomainV1): string {
	const feed = buildFeedVM(domain);
	const lastBuildDate = formatRfc822Date(feed.generatedAt);

	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += '<rss version="2.0">\n';
	xml += '  <channel>\n';

	// Required channel elements
	xml += `    <title>${escapeXml(feed.title)}</title>\n`;
	xml += `    <link>${escapeXml(feed.homePageUrl || '')}</link>\n`;
	xml += `    <description>${escapeXml(feed.description || '')}</description>\n`;

	// Optional channel elements
	xml += `    <lastBuildDate>${lastBuildDate}</lastBuildDate>\n`;
	xml += '    <generator>awesome-pages/parser</generator>\n';

	// Items
	for (const item of feed.items) {
		xml += '    <item>\n';
		xml += `      <title>${escapeXml(item.title)}</title>\n`;
		xml += `      <link>${escapeXml(item.url)}</link>\n`;
		xml += `      <guid isPermaLink="false">${escapeXml(item.id)}</guid>\n`;

		if (item.description) {
			xml += `      <description>${escapeXml(item.description)}</description>\n`;
		}

		xml += `      <pubDate>${formatRfc822Date(item.publishedAt)}</pubDate>\n`;
		xml += '    </item>\n';
	}

	xml += '  </channel>\n';
	xml += '</rss>\n';

	return xml;
}
