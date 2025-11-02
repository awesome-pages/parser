import type { Html, Root, RootContent } from 'mdast';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';

const remarkAwesomePagesMarkers: Plugin<[], Root> =
	() =>
	(tree: Root, file: VFile): void => {
		const isCmd = (value: string, cmd: string): boolean =>
			value.trim() === `<!--awesome-pages:${cmd}-->`;

		let hasExplicitBlocks = false;
		for (const node of tree.children) {
			if (node.type === 'html') {
				const htmlNode = node as Html;
				if (isCmd(htmlNode.value, 'start')) {
					hasExplicitBlocks = true;
					break;
				}
			}
		}

		let parseDepth = 0;
		let ignoreDepth = 0;
		const kept: RootContent[] = [];

		for (const node of tree.children) {
			if (node.type === 'html') {
				const htmlNode = node as Html;
				const v = htmlNode.value.trim();

				if (isCmd(v, 'start')) {
					parseDepth++;
					continue;
				}
				if (isCmd(v, 'end')) {
					parseDepth = Math.max(0, parseDepth - 1);
					continue;
				}
				if (isCmd(v, 'ignore:start')) {
					ignoreDepth++;
					continue;
				}
				if (isCmd(v, 'ignore:end')) {
					ignoreDepth = Math.max(0, ignoreDepth - 1);
					continue;
				}

				continue;
			}

			const include = hasExplicitBlocks
				? parseDepth > 0 && ignoreDepth === 0
				: ignoreDepth === 0;

			if (include) kept.push(node);
		}

		tree.children = kept;

		const data = file.data as Record<string, unknown>;
		data.awesomePages = { hasExplicitBlocks };
	};

export default remarkAwesomePagesMarkers;
