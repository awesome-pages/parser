import { describe, it, expect } from 'vitest';
import { detectLanguage, normalizeBcp47 } from './detectLanguage';

describe('detectLanguage', () => {
	it('should detect English text', () => {
		const text =
			'This is a sample text in English. It contains multiple sentences to help with language detection.';
		expect(detectLanguage(text)).toBe('en');
	});

	it('should detect Spanish text', () => {
		const text =
			'Este es un texto de ejemplo en español. Contiene múltiples oraciones para ayudar con la detección de idioma.';
		expect(detectLanguage(text)).toBe('es');
	});

	it('should detect Portuguese text', () => {
		const text =
			'Este é um texto de exemplo em português. Ele contém várias frases para ajudar na detecção de idioma.';
		expect(detectLanguage(text)).toBe('pt');
	});

	it('should detect French text', () => {
		const text =
			'Ceci est un texte exemple en français. Il contient plusieurs phrases pour aider à la détection de la langue.';
		expect(detectLanguage(text)).toBe('fr');
	});

	it('should default to English for very short text', () => {
		expect(detectLanguage('Hi')).toBe('en');
		expect(detectLanguage('Test')).toBe('en');
		expect(detectLanguage('')).toBe('en');
	});

	it('should default to English for undetermined language', () => {
		expect(detectLanguage('123 456 789')).toBe('en');
	});

	it('should respect minimum confidence threshold', () => {
		// Very short ambiguous text with high confidence threshold
		const result = detectLanguage('the quick brown', 0.9);
		expect(result).toBe('en'); // Should still work for clear English
	});
});

describe('normalizeBcp47', () => {
	it('should normalize simple language codes', () => {
		expect(normalizeBcp47('en')).toBe('en');
		expect(normalizeBcp47('ES')).toBe('es');
		expect(normalizeBcp47('FR')).toBe('fr');
	});

	it('should normalize language-region codes', () => {
		expect(normalizeBcp47('en-US')).toBe('en-us');
		expect(normalizeBcp47('pt-BR')).toBe('pt-br');
		expect(normalizeBcp47('zh-CN')).toBe('zh-cn');
	});

	it('should normalize ISO 639-3 codes', () => {
		expect(normalizeBcp47('eng')).toBe('eng');
		expect(normalizeBcp47('por')).toBe('por');
	});

	it('should default to English for invalid tags', () => {
		expect(normalizeBcp47('')).toBe('en');
		expect(normalizeBcp47('invalid123')).toBe('en');
		expect(normalizeBcp47('x')).toBe('en');
	});

	it('should handle whitespace', () => {
		expect(normalizeBcp47('  en  ')).toBe('en');
		expect(normalizeBcp47(' en-US ')).toBe('en-us');
	});
});
