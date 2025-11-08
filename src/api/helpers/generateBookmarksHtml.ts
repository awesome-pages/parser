import type { DomainV1, ItemV1, SectionV1 } from '@/schemas/v1/domain.v1';

interface BookmarkFolder {
	title: string;
	items: ItemV1[];
	children: BookmarkFolder[];
}

/**
 * Escapes HTML entities in text content for safe insertion into HTML attributes and text nodes.
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Builds a hierarchical folder structure from flat sections array.
 */
function buildFolderHierarchy(
	sections: SectionV1[],
	items: ItemV1[],
): BookmarkFolder[] {
	const sectionMap = new Map<string, SectionV1>();
	const folderMap = new Map<string, BookmarkFolder>();

	// Create map of all sections
	for (const section of sections) {
		sectionMap.set(section.id, section);
	}

	// Create folders for all sections
	for (const section of sections) {
		folderMap.set(section.id, {
			title: section.title,
			items: items.filter((item) => item.sectionId === section.id),
			children: [],
		});
	}

	// Build hierarchy
	const rootFolders: BookmarkFolder[] = [];

	for (const section of sections) {
		const folder = folderMap.get(section.id);
		if (!folder) continue;

		if (section.parentId === null) {
			// Root level section
			rootFolders.push(folder);
		} else {
			// Child section
			const parentFolder = folderMap.get(section.parentId);
			if (parentFolder) {
				parentFolder.children.push(folder);
			}
		}
	}

	// Sort folders and items by order
	const sortFolders = (folders: BookmarkFolder[]) => {
		folders.sort((a, b) => {
			const sectionA = sections.find((s) => s.title === a.title);
			const sectionB = sections.find((s) => s.title === b.title);
			return (sectionA?.order ?? 0) - (sectionB?.order ?? 0);
		});

		for (const folder of folders) {
			folder.items.sort((a, b) => a.order - b.order);
			if (folder.children.length > 0) {
				sortFolders(folder.children);
			}
		}
	};

	sortFolders(rootFolders);

	return rootFolders;
}

/**
 * Generates the ADD_DATE timestamp (Unix timestamp in seconds).
 */
function getTimestamp(): number {
	return Math.floor(Date.now() / 1000);
}

/**
 * Renders a single bookmark item as HTML.
 */
function renderBookmarkItem(item: ItemV1, timestamp: number): string {
	const href = item.url || '#';
	const title = escapeHtml(item.title);
	const description = item.description
		? ` - ${escapeHtml(item.description)}`
		: '';

	// Chrome bookmarks format uses HREF, ADD_DATE attributes
	return `        <DT><A HREF="${escapeHtml(href)}" ADD_DATE="${timestamp}">${title}</A>${description}`;
}

/**
 * Renders a bookmark folder and its contents recursively.
 */
function renderBookmarkFolder(
	folder: BookmarkFolder,
	timestamp: number,
	indentLevel = 1,
): string {
	const indent = '    '.repeat(indentLevel);
	const listIndent = '    '.repeat(indentLevel + 1);

	let html = `${indent}<DT><H3 ADD_DATE="${timestamp}">${escapeHtml(folder.title)}</H3>\n`;
	html += `${indent}<DL><p>\n`;

	// Render items in this folder
	for (const item of folder.items) {
		html += renderBookmarkItem(item, timestamp) + '\n';
	}

	// Render child folders recursively
	for (const child of folder.children) {
		html += renderBookmarkFolder(child, timestamp, indentLevel + 1);
	}

	html += `${indent}</DL><p>\n`;

	return html;
}

/**
 * Generates a Chrome-compatible bookmarks HTML file from DomainV1.
 *
 * The format follows the Netscape Bookmark File Format, which is supported
 * by Chrome, Firefox, Edge, and other modern browsers.
 *
 * @param domain - The parsed domain object containing sections and items
 * @returns HTML string ready to be imported as bookmarks
 */
export function generateBookmarksHtml(domain: DomainV1): string {
	const timestamp = getTimestamp();
	const title = domain.meta.title || 'Awesome List';
	const folders = buildFolderHierarchy(domain.sections, domain.items);

	let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n';
	html += '<!-- This is an automatically generated file.\n';
	html += '     It will be read and overwritten.\n';
	html += '     DO NOT EDIT! -->\n';
	html += `<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n`;
	html += `<TITLE>${escapeHtml(title)}</TITLE>\n`;
	html += `<H1>${escapeHtml(title)}</H1>\n`;
	html += '<DL><p>\n';

	// Create a root folder with the list title
	html += `    <DT><H3 ADD_DATE="${timestamp}">${escapeHtml(title)}</H3>\n`;
	html += '    <DL><p>\n';

	// Render all folders
	for (const folder of folders) {
		html += renderBookmarkFolder(folder, timestamp, 2);
	}

	html += '    </DL><p>\n';
	html += '</DL><p>\n';

	return html;
}
