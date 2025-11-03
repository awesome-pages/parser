import { parseAndNormalizeOptions } from "@/api/schema";
import { runParse } from "@/api/parseRunner";

export type Artifact = "domain" | "index" | "bookmarks";

export type OutputTarget = {
  /** One or more artifacts to emit for this source */
  artifact: Artifact | Artifact[];
  /** Output path template with placeholders like {artifact}, {name}, {dir}, {ext}, {owner}, {repo}, {ref}, {path} */
  to: string;
};

export type SourceSpec = {
  from: string | string[];
  outputs: OutputTarget[];
  strict?: boolean;
};

export type ParseOptions = {
  strict?: boolean;
  concurrency?: number;
  githubToken?: string;
  rootDir?: string;
  sources: SourceSpec[];
};

export type ParseResultFile = {
  file: string;
  artifact: Artifact;
  sourceId: string;
  bytes: number;
};

/**
 * High-level API: parse multiple markdown sources and emit one or more artifacts per source.
 */
export async function parse(opts: ParseOptions): Promise<ParseResultFile[]> {
  const normalized = parseAndNormalizeOptions(opts);
  return runParse(normalized);
}