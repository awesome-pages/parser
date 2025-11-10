import type { DomainV1 } from '@/schemas/v1/domain.v1';

/**
 * Escapes a CSV field value according to RFC 4180.
 * - Wraps in quotes if the value contains comma, quote, or newline
 * - Doubles internal quotes
 */
function escapeCsvField(value: string): string {
	if (!value) return '';

	const needsQuoting = /[",\n\r]/.test(value);

	if (needsQuoting) {
		// Double any internal quotes and wrap in quotes
		return `"${value.replace(/"/g, '""')}"`;
	}

	return value;
}

/**
 * Generates a CSV (Comma-Separated Values) file from DomainV1.
 *
 * The CSV format is useful for importing awesome-lists into spreadsheets,
 * BI tools, or other data processing pipelines that work with tabular data.
 *
 * CSV structure:
 * - Header row with column names
 * - One row per item from domain.items
 * - Proper RFC 4180 quoting for commas, quotes, and newlines
 *
 * Columns:
 * - id: item id
 * - title: item title
 * - url: item URL (if any)
 * - sectionId: section id where the item lives
 * - sectionTitle: section title (denormalized)
 * - description: plain-text description
 * - tags: tags joined by pipe (|)
 *
 * @param domain - The parsed domain object containing sections and items
 * @returns UTF-8 CSV string with header and data rows
 */
export function generateCsv(domain: DomainV1): string {
	// Build section map for quick lookups
	const sectionMap = new Map(
		domain.sections.map((section) => [section.id, section]),
	);

	// CSV header
	const header = 'id,title,url,sectionId,sectionTitle,description,tags\n';

	// Generate rows
	const rows = domain.items.map((item) => {
		const section = sectionMap.get(item.sectionId);
		const sectionTitle = section ? section.title : '';

		const fields = [
			item.id,
			item.title,
			item.url || '',
			item.sectionId,
			sectionTitle,
			item.description || '',
			item.tags.join('|'),
		];

		return fields.map(escapeCsvField).join(',');
	});

	return header + rows.join('\n') + (rows.length > 0 ? '\n' : '');
}
