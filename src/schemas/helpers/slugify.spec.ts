import { describe, expect, it } from 'vitest';
import slugify from '@/schemas/helpers/slugify';

/**
 * Unit tests for slugify & slugifyUP helpers
 */

describe('slugify', () => {
	it('lowercases and replaces spaces with hyphens', () => {
		expect(slugify('Hello World')).toBe('hello-world');
	});

	it('trims leading and trailing separators', () => {
		expect(slugify('  --Hello--  ')).toBe('hello');
	});

	it('collapses multiple non-alphanumeric chars into a single hyphen', () => {
		expect(slugify('a___b---c..d')).toBe('a-b-c-d');
	});

	it('removes diacritics (NFD + \\p{Diacritic})', () => {
		expect(slugify('São Tomé e Príncipe')).toBe('sao-tome-e-principe');
		expect(slugify('ÀÈÌÒÙ áéíóú ç ãõ âêîôû')).toBe('aeiou-aeiou-c-ao-aeiou');
	});

	it('preserves numbers and letters only', () => {
		expect(slugify('v2 Release 3.0.1')).toBe('v2-release-3-0-1');
	});

	it('handles emojis and symbols by removing them', () => {
		expect(slugify('Café ☕️ — 100%')).toBe('cafe-100');
	});

	it('returns empty string for empty/whitespace input', () => {
		expect(slugify('')).toBe('');
		expect(slugify('   ')).toBe('');
	});

	it('is idempotent (applying twice yields same result)', () => {
		const once = slugify('Hello, World!');
		const twice = slugify(once);
		expect(twice).toBe(once);
	});
});
