import { describe, expect, it } from 'vitest';
import extractInlineTags from '@/core/helpers/extractInlineTags';

describe('extractInlineTags', () => {
	it('returns original description and empty tags when there is no tag block', () => {
		const input = 'Conversational model';
		const { clean, tags } = extractInlineTags(input);
		expect(clean).toBe('Conversational model');
		expect(tags).toEqual([]);
	});

	it('extracts multiple tags from trailing parenthesized block and removes it from description', () => {
		const input = 'Conversational model (#ai #llm)';
		const { clean, tags } = extractInlineTags(input);
		expect(clean).toBe('Conversational model');
		expect(tags).toEqual(['ai', 'llm']);
	});

	it('lowercases and deduplicates tags while preserving order', () => {
		const input = 'Assistant tool (#AI #ai #Llm #nlp #NLP)';
		const { clean, tags } = extractInlineTags(input);
		expect(clean).toBe('Assistant tool');
		expect(tags).toEqual(['ai', 'llm', 'nlp']);
	});

	it('ignores parentheses that do not contain #tags', () => {
		const input = 'Collaborative design tool (beta)';
		const { clean, tags } = extractInlineTags(input);
		expect(clean).toBe('Collaborative design tool (beta)');
		expect(tags).toEqual([]);
	});

	it('only considers a trailing parenthesized block; inline #hashtags are ignored', () => {
		const input = 'Great tool #ai for teams (#collab)';
		const { clean, tags } = extractInlineTags(input);
		expect(clean).toBe('Great tool #ai for teams');
		expect(tags).toEqual(['collab']);
	});

	it('trims spaces around the tag block and inside it', () => {
		const input = 'Description with spaces   (   #ai    #nlp   )   ';
		const { clean, tags } = extractInlineTags(input);
		expect(clean).toBe('Description with spaces');
		expect(tags).toEqual(['ai', 'nlp']);
	});

	it('handles separators in description before the tag block', () => {
		const input = '- Conversational model — fast (#ai #chatbot)';
		const { clean, tags } = extractInlineTags(input);
		expect(clean).toBe('- Conversational model — fast');
		expect(tags).toEqual(['ai', 'chatbot']);
	});
});
