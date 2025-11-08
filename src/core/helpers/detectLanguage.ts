import { francAll } from 'franc-min';

/**
 * Map from ISO 639-3 (franc output) to BCP 47 language tags
 * franc returns ISO 639-3 codes, but BCP 47 uses ISO 639-1 when available
 */
const ISO_639_3_TO_BCP_47: Record<string, string> = {
	eng: 'en',
	spa: 'es',
	fra: 'fr',
	deu: 'de',
	ita: 'it',
	por: 'pt',
	rus: 'ru',
	jpn: 'ja',
	kor: 'ko',
	zho: 'zh',
	ara: 'ar',
	hin: 'hi',
	ben: 'bn',
	nld: 'nl',
	pol: 'pl',
	tur: 'tr',
	vie: 'vi',
	tha: 'th',
	swe: 'sv',
	dan: 'da',
	fin: 'fi',
	nor: 'no',
	ces: 'cs',
	ron: 'ro',
	hun: 'hu',
	ell: 'el',
	heb: 'he',
	ukr: 'uk',
	cat: 'ca',
	ind: 'id',
	msa: 'ms',
	fas: 'fa',
};

/**
 * Detects the language of a text and returns the BCP 47 language tag
 * @param text - The text to analyze
 * @param minConfidence - Minimum confidence threshold (0-1). Default: 0.5
 * @returns BCP 47 language tag or 'en' if detection fails
 */
export function detectLanguage(
	text: string,
	minConfidence = 0.5,
): string {
	if (!text || text.trim().length < 30) {
		// Too short to reliably detect, default to English
		return 'en';
	}

	try {
		// francAll returns array of [language, confidence] tuples
		const results = francAll(text, { minLength: 3 });

		if (results.length === 0 || results[0][0] === 'und') {
			// 'und' means undetermined
			return 'en';
		}

		const [detectedLang, confidence] = results[0];

		// Check if confidence meets threshold
		if (confidence < minConfidence) {
			return 'en';
		}

		// Convert from ISO 639-3 to BCP 47
		return ISO_639_3_TO_BCP_47[detectedLang] || detectedLang;
	} catch {
		// If detection fails, default to English
		return 'en';
	}
}

/**
 * Validates and normalizes a BCP 47 language tag
 * Accepts both full BCP 47 tags (e.g., 'en-US') and simple codes (e.g., 'en')
 */
export function normalizeBcp47(tag: string): string {
	if (!tag) return 'en';

	// Basic validation: should start with 2-3 letter language code
	const normalized = tag.trim().toLowerCase();
	const match = normalized.match(/^[a-z]{2,3}(-[a-z]{2,4})?$/i);

	if (!match) {
		return 'en';
	}

	return normalized;
}
