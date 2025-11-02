import fs from 'node:fs/promises';
import path from 'node:path';
import { MarkdownSource } from './types.js';

export class LocalFileSource implements MarkdownSource {
  constructor(private filepath: string) {}
  id() {
    return `local:${path.resolve(this.filepath)}`;
  }
  async read(): Promise<string> {
    return fs.readFile(this.filepath, 'utf8');
  }
}
