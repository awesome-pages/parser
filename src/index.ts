/**
 * @awesome-pages/parser
 *
 * A powerful parser for Awesome Lists that converts markdown to structured domain objects
 * and generates various artifacts like bookmarks, search indices, sitemaps, and RSS feeds.
 */

// Artifact generators
export { generateBookmarksHtml } from './api/artifacts/generateBookmarksHtml.js';
export type {
	Artifact,
	OutputTarget,
	ParseOptions,
	ParseResultFile,
	SourceSpec,
} from './api/index.js';
// Main parsing API
export { parse } from './api/index.js';
export type { SearchIndex } from './core/helpers/buildIndex.js';
export { buildIndex } from './core/helpers/buildIndex.js';
// Domain types
export type {
	DomainV1,
	ItemV1,
	SectionV1,
} from './schemas/v1/domain.v1.js';
// Schema generation
export { generateDomainV1JsonSchema } from './schemas/v1/jsonSchema.js';
