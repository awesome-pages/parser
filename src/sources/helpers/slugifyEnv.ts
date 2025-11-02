function slugifyEnv(s: string): string {
	return s
		.replace(/[^a-zA-Z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.toUpperCase();
}

export { slugifyEnv };
