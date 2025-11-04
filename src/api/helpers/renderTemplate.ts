type TemplateContextValue = string | number | null | undefined;

export type TemplateContext = Record<string, TemplateContextValue>;

/**
 * Very small placeholder renderer.
 * Replaces `{key}` by `String(ctx[key])` if defined, or `""` otherwise.
 */
export function renderTemplate(tpl: string, ctx: TemplateContext): string {
	return tpl.replace(/\{([a-zA-Z0-9_:-]+)\}/g, (_match, rawKey) => {
		const key = String(rawKey);
		const value = ctx[key];
		if (value === undefined || value === null) return '';
		return String(value);
	});
}
