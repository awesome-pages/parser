import { describe, expect, it } from 'vitest';
import { renderTemplate } from './renderTemplate';

describe('renderTemplate', () => {
	it('replaces single placeholder with string value', () => {
		const result = renderTemplate('Hello {name}!', { name: 'World' });
		expect(result).toBe('Hello World!');
	});

	it('replaces multiple placeholders', () => {
		const result = renderTemplate('{greeting} {name}, welcome to {place}!', {
			greeting: 'Hello',
			name: 'Alice',
			place: 'Wonderland',
		});
		expect(result).toBe('Hello Alice, welcome to Wonderland!');
	});

	it('replaces numeric values', () => {
		const result = renderTemplate('Answer: {answer}', { answer: 42 });
		expect(result).toBe('Answer: 42');
	});

	it('replaces zero value', () => {
		const result = renderTemplate('Count: {count}', { count: 0 });
		expect(result).toBe('Count: 0');
	});

	it('replaces same placeholder multiple times', () => {
		const result = renderTemplate('{name} loves {name}!', { name: 'Bob' });
		expect(result).toBe('Bob loves Bob!');
	});

	it('returns empty string for undefined values', () => {
		const result = renderTemplate('Value: {missing}', {});
		expect(result).toBe('Value: ');
	});

	it('returns empty string for null values', () => {
		const result = renderTemplate('Value: {value}', { value: null });
		expect(result).toBe('Value: ');
	});

	it('handles template without placeholders', () => {
		const result = renderTemplate('No placeholders here', { name: 'Alice' });
		expect(result).toBe('No placeholders here');
	});

	it('handles empty template', () => {
		const result = renderTemplate('', { name: 'Alice' });
		expect(result).toBe('');
	});

	it('handles empty context', () => {
		const result = renderTemplate('Hello {name}!', {});
		expect(result).toBe('Hello !');
	});

	it('preserves placeholders with invalid key characters', () => {
		const result = renderTemplate('Value: {invalid key}', {
			'invalid key': 'test',
		});
		expect(result).toBe('Value: {invalid key}');
	});

	it('handles placeholders with underscores', () => {
		const result = renderTemplate('File: {file_name}', { file_name: 'test.txt' });
		expect(result).toBe('File: test.txt');
	});

	it('handles placeholders with hyphens', () => {
		const result = renderTemplate('ID: {user-id}', { 'user-id': '12345' });
		expect(result).toBe('ID: 12345');
	});

	it('handles placeholders with colons', () => {
		const result = renderTemplate('Namespace: {ns:value}', { 'ns:value': 'test' });
		expect(result).toBe('Namespace: test');
	});

	it('handles placeholders with numbers', () => {
		const result = renderTemplate('Item: {item1} and {item2}', {
			item1: 'first',
			item2: 'second',
		});
		expect(result).toBe('Item: first and second');
	});

	it('handles mixed defined and undefined placeholders', () => {
		const result = renderTemplate('{a}-{b}-{c}', { a: 'foo', c: 'baz' });
		expect(result).toBe('foo--baz');
	});

	it('handles placeholders in paths', () => {
		const result = renderTemplate('/output/{dir}/{name}.{ext}', {
			dir: 'docs',
			name: 'readme',
			ext: 'json',
		});
		expect(result).toBe('/output/docs/readme.json');
	});

	it('handles placeholders in URLs', () => {
		const result = renderTemplate('https://{domain}/api/{version}/{endpoint}', {
			domain: 'example.com',
			version: 'v1',
			endpoint: 'users',
		});
		expect(result).toBe('https://example.com/api/v1/users');
	});

	it('converts number to string correctly', () => {
		const result = renderTemplate('{float} and {negative}', {
			float: 3.14,
			negative: -100,
		});
		expect(result).toBe('3.14 and -100');
	});

	it('handles boolean-like numeric values', () => {
		const result = renderTemplate('{true} {false}', {
			true: 1,
			false: 0,
		});
		expect(result).toBe('1 0');
	});

	it('handles adjacent placeholders without separator', () => {
		const result = renderTemplate('{first}{second}', {
			first: 'Hello',
			second: 'World',
		});
		expect(result).toBe('HelloWorld');
	});

	it('handles complex real-world template', () => {
		const result = renderTemplate(
			'output/{owner}_{repo}_{ref}/{dir}/{name}.{ext}',
			{
				owner: 'awesome-pages',
				repo: 'parser',
				ref: 'main',
				dir: 'docs',
				name: 'readme',
				ext: 'json',
			}
		);
		expect(result).toBe('output/awesome-pages_parser_main/docs/readme.json');
	});

	it('handles template with only placeholders', () => {
		const result = renderTemplate('{a}{b}{c}', { a: '1', b: '2', c: '3' });
		expect(result).toBe('123');
	});

	it('handles escaped-looking braces but still processes placeholders', () => {
		const result = renderTemplate('{{name}}', { name: 'test' });
		expect(result).toBe('{test}');
	});

	it('handles placeholder at start', () => {
		const result = renderTemplate('{name} is great', { name: 'Alice' });
		expect(result).toBe('Alice is great');
	});

	it('handles placeholder at end', () => {
		const result = renderTemplate('Hello {name}', { name: 'Alice' });
		expect(result).toBe('Hello Alice');
	});

	it('preserves whitespace around placeholders', () => {
		const result = renderTemplate('  {a}  {b}  ', { a: 'foo', b: 'bar' });
		expect(result).toBe('  foo  bar  ');
	});
});
