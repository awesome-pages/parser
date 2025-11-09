/**
 * @awesome-pages/parser
 *
 * A powerful parser for Awesome Lists that converts markdown to structured domain objects
 * and generates various artifacts like bookmarks, search indices, sitemaps, and RSS feeds.
 */

// Main parsing API
export { parse } from './api/index.js';
export type {
	ParseOptions,
	SourceSpec,
	OutputTarget,
	Artifact,
	ParseResultFile,
} from './api/index.js';

// Schema generation
export { generateDomainV1JsonSchema } from './schemas/v1/jsonSchema.js';

// Artifact generators
export { generateBookmarksHtml } from './api/artifacts/generateBookmarksHtml.js';
export { buildIndex } from './core/helpers/buildIndex.js';
export type { SearchIndex } from './core/helpers/buildIndex.js';

// Domain types
export type {
	DomainV1,
	SectionV1,
	ItemV1,
} from './schemas/v1/domain.v1.js';
