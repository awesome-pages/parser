import type { DomainV1 } from '@/schemas/v1/domain.v1';
import { getStopwords } from './stopwords.js';

export interface SearchIndex {
	schemaVersion: 1;
	meta: {
		source?: string;
		repo?: string;
		ref?: string;
		path?: string;
		generatedAt: string;
		fieldWeights: {
			title: number;
			description: number;
			tags: number;
		};
	};
	stats?: {
		docs: number;
		terms: number;
	};
	docs: Record<
		string,
		{
			title: string;
			url?: string;
			sectionId: string;
		}
	>;
	terms: Record<
		string,
		Array<{
			id: string;
			f: number;
		}>
	>;
}

/**
 * Tokenize and normalize text for indexing.
 * - Converts to lowercase
 * - Removes punctuation
 * - Splits on whitespace
 * - Removes stopwords based on language
 * - Normalizes version suffixes (e.g., "v2" -> "v")
 */
export function tokenize(text: string, stopwords: Set<string>): string[] {
	if (!text) return [];

	// Lowercase and replace punctuation with spaces, but keep dots temporarily for version detection
	const normalized = text
		.toLowerCase()
		.replace(/[,!?:;()[\]{}'"]/g, ' ')
		// Keep hyphens and dots temporarily
		.replace(/[-_/]/g, ' ');

	// Split on whitespace and filter
	const tokens = normalized
		.split(/\s+/)
		.filter((token) => token.length > 0)
		.map((token) => {
			// Normalize version suffixes: v2, v3.1 -> v
			// Must happen before removing dots
			return token.replace(/^v\d+(\.\d+)*$/, 'v');
		})
		// Now remove remaining dots and filter out empty strings
		.map((token) => token.replace(/\./g, ''))
		.filter((token) => token.length > 0)
		.filter((token) => !stopwords.has(token));

	return tokens;
}

/**
 * Parse source string into structured parts.
 * Formats: "github:owner/repo@ref:path" or "local:path" or any other string
 */
function parseSource(source: string): {
	source?: string;
	repo?: string;
	ref?: string;
	path?: string;
} {
	// Match github format: github:owner/repo@ref:path
	const githubMatch = source.match(/^github:([^@]+)@([^:]+):(.+)$/);
	if (githubMatch) {
		return {
			repo: githubMatch[1],
			ref: githubMatch[2],
			path: githubMatch[3],
		};
	}

	// For other formats, keep the original source
	return { source };
}

/**
 * Build an inverted index from a DomainV1 object.
 * Creates a searchable index with:
 * - docs: minimal metadata per item
 * - terms: postings list mapping terms to document IDs with frequencies
 */
export function buildIndex(domain: DomainV1): SearchIndex {
	const docs: SearchIndex['docs'] = {};
	const termFrequencies = new Map<
		string,
		Map<string, { title: number; description: number; tags: number }>
	>();

	// Get stopwords based on domain language
	const language = domain.meta.language || 'en';
	const stopwords = getStopwords(language);

	// Process each item in the domain
	for (const item of domain.items) {
		// Build docs map
		docs[item.id] = {
			title: item.title,
			url: item.url,
			sectionId: item.sectionId,
		};

		// Tokenize title (weight: 2)
		const titleTokens = tokenize(item.title, stopwords);
		for (const token of titleTokens) {
			if (!termFrequencies.has(token)) {
				termFrequencies.set(token, new Map());
			}
			const docFreqs = termFrequencies.get(token)!;
			if (!docFreqs.has(item.id)) {
				docFreqs.set(item.id, { title: 0, description: 0, tags: 0 });
			}
			docFreqs.get(item.id)!.title += 1;
		}

		// Tokenize description (weight: 1)
		if (item.description) {
			const descTokens = tokenize(item.description, stopwords);
			for (const token of descTokens) {
				if (!termFrequencies.has(token)) {
					termFrequencies.set(token, new Map());
				}
				const docFreqs = termFrequencies.get(token)!;
				if (!docFreqs.has(item.id)) {
					docFreqs.set(item.id, { title: 0, description: 0, tags: 0 });
				}
				docFreqs.get(item.id)!.description += 1;
			}
		}

		// Tokenize tags (weight: 1.5)
		if (item.tags && item.tags.length > 0) {
			for (const tag of item.tags) {
				const tagTokens = tokenize(tag, stopwords);
				for (const token of tagTokens) {
					if (!termFrequencies.has(token)) {
						termFrequencies.set(token, new Map());
					}
					const docFreqs = termFrequencies.get(token)!;
					if (!docFreqs.has(item.id)) {
						docFreqs.set(item.id, { title: 0, description: 0, tags: 0 });
					}
					docFreqs.get(item.id)!.tags += 1;
				}
			}
		}
	}

	// Build the terms postings list with weighted frequencies
	const terms: SearchIndex['terms'] = {};
	const fieldWeights = { title: 2, description: 1, tags: 1.5 };

	for (const [term, docFreqs] of termFrequencies.entries()) {
		const postings: Array<{ id: string; f: number }> = [];

		for (const [docId, freqs] of docFreqs.entries()) {
			// Calculate weighted frequency
			const weightedFreq =
				freqs.title * fieldWeights.title +
				freqs.description * fieldWeights.description +
				freqs.tags * fieldWeights.tags;

			postings.push({
				id: docId,
				f: weightedFreq,
			});
		}

		// Sort by frequency (descending) for better performance
		postings.sort((a, b) => b.f - a.f);

		terms[term] = postings;
	}

	return {
		schemaVersion: 1,
		meta: {
			...parseSource(domain.meta.source),
			generatedAt: domain.meta.generatedAt,
			fieldWeights,
		},
		stats: {
			docs: Object.keys(docs).length,
			terms: Object.keys(terms).length,
		},
		docs,
		terms,
	};
}
