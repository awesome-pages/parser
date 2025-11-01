/**
 * Deterministic item ID generator, isolated by section.
 * - Uses a slugified title as base.
 * - Ensures uniqueness within the same section (suffix -2, -3, ...).
 * - Deterministic: same inputs → same IDs given same order.
 */

import slugify from '@/helpers/slugify';

const takenBySection = new Map<string, Set<string>>();

export function computeDeterministicItemId(
  sectionId: string,
  title: string
): string {
  // get or create the Set for this section
  let taken = takenBySection.get(sectionId);
  if (!taken) {
    taken = new Set<string>();
    takenBySection.set(sectionId, taken);
  }

  // create a clean slug
  const base = slugify(title);
  let candidate = base;
  let n = 2;

  // resolve collisions inside the same section
  while (taken.has(candidate)) {
    candidate = `${base}-${n++}`;
  }

  // mark as taken and return
  taken.add(candidate);
  return candidate;
}
