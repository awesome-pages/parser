export interface MarkdownSource {
	read(): Promise<string>;
	id(): string;
}
