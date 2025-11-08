import { describe, it, expect } from 'vitest';
import { getStopwords } from './stopwords';

describe('getStopwords', () => {
	it('should return English stopwords for "en"', () => {
		const stopwords = getStopwords('en');
		expect(stopwords.has('the')).toBe(true);
		expect(stopwords.has('and')).toBe(true);
		expect(stopwords.has('is')).toBe(true);
		// stopwords-iso includes 'hello' as a stopword
		expect(stopwords.size).toBeGreaterThan(100);
	});

	it('should return Spanish stopwords for "es"', () => {
		const stopwords = getStopwords('es');
		expect(stopwords.has('el')).toBe(true);
		expect(stopwords.has('la')).toBe(true);
		expect(stopwords.has('de')).toBe(true);
		expect(stopwords.size).toBeGreaterThan(50);
	});

	it('should return Portuguese stopwords for "pt"', () => {
		const stopwords = getStopwords('pt');
		expect(stopwords.has('o')).toBe(true);
		expect(stopwords.has('a')).toBe(true);
		expect(stopwords.has('de')).toBe(true);
		expect(stopwords.size).toBeGreaterThan(50);
	});

	it('should return French stopwords for "fr"', () => {
		const stopwords = getStopwords('fr');
		expect(stopwords.has('le')).toBe(true);
		expect(stopwords.has('la')).toBe(true);
		expect(stopwords.has('de')).toBe(true);
		expect(stopwords.size).toBeGreaterThan(50);
	});

	it('should return German stopwords for "de"', () => {
		const stopwords = getStopwords('de');
		expect(stopwords.has('der')).toBe(true);
		expect(stopwords.has('die')).toBe(true);
		expect(stopwords.has('und')).toBe(true);
		expect(stopwords.size).toBeGreaterThan(50);
	});

	it('should extract primary language from BCP 47 tags', () => {
		const enUS = getStopwords('en-US');
		const ptBR = getStopwords('pt-BR');
		const zhCN = getStopwords('zh-CN');

		expect(enUS.has('the')).toBe(true);
		expect(ptBR.has('o')).toBe(true);
		expect(zhCN.has('的')).toBe(true);
	});

	it('should default to English for unknown languages', () => {
		const stopwords = getStopwords('unknown');
		expect(stopwords.has('the')).toBe(true);
		expect(stopwords.has('and')).toBe(true);
	});

	it('should handle case-insensitive language codes', () => {
		const stopwords1 = getStopwords('EN');
		const stopwords2 = getStopwords('En');
		const stopwords3 = getStopwords('en');

		expect(stopwords1).toEqual(stopwords2);
		expect(stopwords2).toEqual(stopwords3);
	});

	it('should not treat common tech terms as stopwords', () => {
		const stopwords = getStopwords('en');

		// AI/ML terms
		expect(stopwords.has('ai')).toBe(false);
		expect(stopwords.has('ml')).toBe(false);
		expect(stopwords.has('llm')).toBe(false);

		// Web technologies
		expect(stopwords.has('html')).toBe(false);
		expect(stopwords.has('css')).toBe(false);
		expect(stopwords.has('js')).toBe(false);
		expect(stopwords.has('json')).toBe(false);
		expect(stopwords.has('api')).toBe(false);
		expect(stopwords.has('rest')).toBe(false);
		expect(stopwords.has('http')).toBe(false);

		// Development tools
		expect(stopwords.has('git')).toBe(false);
		expect(stopwords.has('cli')).toBe(false);
		expect(stopwords.has('sdk')).toBe(false);
		expect(stopwords.has('ci')).toBe(false);
		expect(stopwords.has('cd')).toBe(false);

		// Design/UX
		expect(stopwords.has('ui')).toBe(false);
		expect(stopwords.has('ux')).toBe(false);
		expect(stopwords.has('seo')).toBe(false);

		// Cloud
		expect(stopwords.has('aws')).toBe(false);
		expect(stopwords.has('cdn')).toBe(false);

		// Database
		expect(stopwords.has('db')).toBe(false);
		expect(stopwords.has('sql')).toBe(false);
	});
});
