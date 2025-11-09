import { z } from 'zod';
import slugify from '@/schemas/helpers/slugify';

const NonEmpty = z.string().trim().min(1);

// Schema base da Section (output/estrutura final)
export const SectionV1Base = z.object({
	id: NonEmpty,
	title: NonEmpty,
	parentId: z.string().trim().nullable(),
	depth: z.number().int().nonnegative(),
	order: z.number().int().nonnegative(),
	path: NonEmpty,
	descriptionHtml: z.string().trim().nullable(),
});
export type SectionV1 = z.infer<typeof SectionV1Base>;

// Schema de input para Section
export const SectionIn = z.object({
	title: NonEmpty,
	parentId: z.string().trim().nullable(),
	depth: z.number().int().nonnegative(),
	order: z.number().int().nonnegative(),
	descriptionHtml: z.string().trim().nullable().optional(),
});
export type SectionIn = z.infer<typeof SectionIn>;

// Schema com transform para parsing
export const SectionV1Schema = SectionIn.transform((s) => {
	const id = slugify(s.title);
	const path = s.parentId ? `${s.parentId}/${id}` : id;
	return {
		id,
		title: s.title.trim(),
		parentId: s.parentId,
		depth: s.depth,
		order: s.order,
		path,
		descriptionHtml: s.descriptionHtml ?? null,
	};
});

// Schema base do Item (output/estrutura final)
export const ItemV1Base = z.object({
	id: NonEmpty,
	sectionId: NonEmpty,
	title: NonEmpty,
	url: z.string().url().optional(),
	description: z.string().trim().nullable(),
	descriptionHtml: z.string().trim().nullable(),
	order: z.number().int().nonnegative(),
	tags: z.array(z.string()),
});
export type ItemV1 = z.infer<typeof ItemV1Base>;

// Schema de input para Item
export const ItemIn = z.object({
	id: NonEmpty,
	sectionId: NonEmpty,
	title: NonEmpty,
	url: z.string().url().optional(),
	description: z.string().trim().nullable().optional(),
	descriptionHtml: z.string().trim().nullable().optional(),
	order: z.number().int().nonnegative().optional(),
	tags: z.array(z.string()).optional(),
});
export type ItemIn = z.infer<typeof ItemIn>;

// Schema com transform para parsing
export const ItemV1Schema = ItemIn.transform((i) => ({
	id: i.id,
	sectionId: i.sectionId,
	title: i.title.trim(),
	url: i.url,
	description: i.description ?? null,
	descriptionHtml: i.descriptionHtml ?? null,
	order: i.order ?? 0,
	tags: i.tags ?? [],
}));

// Schema base do DomainV1 (output/estrutura final)
export const DomainV1Base = z.object({
	$schema: z.string().url().optional(),
	schemaVersion: z.literal(1),
	meta: z.object({
		title: z.string().optional(),
		description: z.string().optional(),
		descriptionHtml: z.string().optional(),
		generatedAt: z.string().datetime(),
		source: z.string().min(1),
		language: z.string().optional(),
		frontmatter: z.record(z.any()).optional(),
	}),
	sections: z.array(SectionV1Base),
	items: z.array(ItemV1Base),
});
export type DomainV1 = z.infer<typeof DomainV1Base>;

// Schema com transform e validação para parsing
export const DomainV1Schema = z
	.object({
		$schema: z.string().url().optional(),
		schemaVersion: z.literal(1),
		meta: z.object({
			title: z.string().optional(),
			description: z.string().optional(),
			descriptionHtml: z.string().optional(),
			generatedAt: z.string().datetime(),
			source: z.string().min(1),
			language: z.string().optional(),
			frontmatter: z.record(z.any()).optional(),
		}),
		sections: z.array(SectionV1Schema),
		items: z.array(ItemV1Schema),
	})
	.superRefine((dom, ctx) => {
		const sectionIds = new Set(dom.sections.map((s) => s.id));
		for (const it of dom.items) {
			if (!sectionIds.has(it.sectionId)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `item.sectionId "${it.sectionId}" does not exist in sections`,
					path: ['items', 'sectionId'],
				});
			}
		}
	});
