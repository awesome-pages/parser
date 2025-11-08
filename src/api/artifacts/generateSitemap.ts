import type { DomainV1 } from '@/schemas/v1/domain.v1';

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
 * Formats a date to W3C datetime format (YYYY-MM-DD) required by sitemap protocol.
 */
function formatDate(date: string): string {
	return date.split('T')[0];
}

/**
 * Generates a sitemap.xml file from DomainV1.
 * 
 * The format follows the Sitemap Protocol (https://www.sitemaps.org/protocol.html),
 * which is used by search engines like Google, Bing, and others to discover URLs.
 * 
 * Each item with a valid URL becomes a <url> entry in the sitemap.
 * The lastmod date is set to the domain's generatedAt timestamp.
 * 
 * @param domain - The parsed domain object containing sections and items
 * @param baseUrl - The base URL for the sitemap (e.g., 'https://example.com')
 * @returns XML string ready to be saved as sitemap.xml
 */
export function generateSitemap(domain: DomainV1, baseUrl?: string): string {
	const lastmod = formatDate(domain.meta.generatedAt);
	
	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
	xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

	// Add items with valid URLs to the sitemap
	for (const section of domain.sections) {
		const sectionItems = domain.items.filter(
			(item) => item.sectionId === section.id && item.url,
		);

		for (const item of sectionItems) {
			const loc = item.url!;
			
			xml += '  <url>\n';
			xml += `    <loc>${escapeXml(loc)}</loc>\n`;
			xml += `    <lastmod>${lastmod}</lastmod>\n`;
			xml += '    <changefreq>weekly</changefreq>\n';
			xml += '    <priority>0.5</priority>\n';
			xml += '  </url>\n';
		}
	}

	xml += '</urlset>\n';

	return xml;
}
