import { z } from "zod";

export const ItemSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().url().optional(),
    description: z.string().nullable().optional(),
    descriptionHtml: z.string().nullable().optional(),
    tags: z.array(z.string()).default([])
  })
);
export type Item = z.infer<typeof ItemSchema>;

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(ItemSchema).default([])
});
export type Section = z.infer<typeof SectionSchema>;

export const ReadmeDomainSchema = z.object({
  schemaVersion: z.literal(1),
  meta: z.object({
    title: z.string().optional(),
    introHtml: z.string().nullable().optional(),
    generatedAt: z.string().datetime().optional(),
    source: z.string().nullable().optional()
  }).default({}),
  sections: z.array(SectionSchema)
});
export type ReadmeDomain = z.infer<typeof ReadmeDomainSchema>;

// Tipos auxiliares vindos do plugin de comentários
export type MetaBlock = Record<string, unknown>;
export interface RegionMarker {
  start?: { [k: string]: string };
  end?: boolean;
}
export interface MetaHints {
  blocks: MetaBlock[]; // de <!-- meta { ... } -->
  regions: RegionMarker[]; // pares awesome:start / awesome:end
}
