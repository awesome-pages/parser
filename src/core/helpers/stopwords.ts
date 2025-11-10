/**
 * Language-specific stopwords for search indexing
 * Uses stopwords-iso package for comprehensive multilingual support
 */

// @ts-expect-error - stopwords-iso doesn't have type definitions
import stopwords from 'stopwords-iso';

/**
 * Common technology terms that should NOT be treated as stopwords,
 * even if they appear in stopwords-iso lists.
 * These are important for technical documentation and awesome lists.
 */
const TECH_TERMS_WHITELIST = new Set([
	// AI/ML terms
	'ai',
	'ml',
	'llm',
	'gpt',
	'nlp',
	'cv',
	'nn',
	// Web technologies
	'html',
	'css',
	'js',
	'ts',
	'jsx',
	'tsx',
	'xml',
	'json',
	'yaml',
	'toml',
	'svg',
	'http',
	'https',
	'ssh',
	'ftp',
	'tcp',
	'udp',
	'ip',
	'dns',
	'url',
	'uri',
	'api',
	'rest',
	'graphql',
	'grpc',
	'soap',
	'cors',
	'csrf',
	'xss',
	'sql',
	'nosql',
	// Development tools
	'git',
	'npm',
	'yarn',
	'pnpm',
	'pip',
	'cli',
	'gui',
	'ide',
	'sdk',
	'ci',
	'cd',
	'devops',
	// Cloud/Infrastructure
	'aws',
	'gcp',
	'azure',
	'cdn',
	'vpn',
	'ssl',
	'tls',
	'dns',
	'k8s',
	'docker',
	// Database
	'db',
	'sql',
	'orm',
	'crud',
	// Design/UX
	'ui',
	'ux',
	'seo',
	'a11y',
	'i18n',
	'l10n',
	// Architectures/Patterns
	'mvc',
	'mvvm',
	'spa',
	'pwa',
	'ssr',
	'csr',
	// Auth
	'jwt',
	'oauth',
	'saml',
	'sso',
	// Browser APIs
	'dom',
	'bom',
	'xhr',
	'ajax',
	'wasm',
	// Operating Systems
	'os',
	'ios',
	'macos',
	'linux',
	'unix',
	// File formats
	'pdf',
	'csv',
	'md',
	'rst',
]);

/**
 * Get stopwords for a specific language.
 * Extracts the primary language code from BCP 47 tags (e.g., 'pt-BR' -> 'pt').
 * Falls back to English if the language is not supported.
 * Excludes common tech terms from the stopwords list.
 *
 * @param language - BCP 47 language tag (e.g., 'en', 'pt-BR', 'zh-CN')
 * @returns Set of stopwords for the language
 */
export function getStopwords(language: string): Set<string> {
	// Extract primary language code (e.g., 'pt-BR' -> 'pt')
	const primaryLang = language.split('-')[0].toLowerCase();

	// Get stopwords for the language from stopwords-iso
	const languageStopwords = stopwords[primaryLang as keyof typeof stopwords];

	let stopwordsList: string[];
	if (languageStopwords && Array.isArray(languageStopwords)) {
		stopwordsList = languageStopwords;
	} else {
		// Fallback to English stopwords
		stopwordsList = stopwords.en || [];
	}

	// Filter out tech terms from stopwords
	const filteredStopwords = stopwordsList.filter(
		(word) => !TECH_TERMS_WHITELIST.has(word),
	);

	return new Set(filteredStopwords);
}
