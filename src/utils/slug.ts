import slugify from "@sindresorhus/slugify";

export function slug(text: string) {
  return slugify(text, { decamelize: false, separator: "-" });
}
