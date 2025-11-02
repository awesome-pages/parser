function extractInlineTags(desc: string): { clean: string; tags: string[] } {
  // Match trailing parenthesized tags e.g., "... description (#ai #llm)"
  const m = desc.match(/\((\s*#[a-z0-9_-]+(?:\s+#[a-z0-9_-]+)*\s*)\)\s*$/i);
  if (!m) return { clean: desc, tags: [] };
  const rawTags = m[1]
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/^#/, '').toLowerCase());
  // Remove the matched tags block from the description
  const clean = desc.slice(0, m.index).trim();
  // De-duplicate while preserving order
  const seen = new Set<string>();
  const tags = rawTags.filter((t) =>
    seen.has(t) ? false : (seen.add(t), true)
  );
  return { clean, tags };
}

export default extractInlineTags;
