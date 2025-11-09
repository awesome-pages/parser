import { parse } from '@/api/index';

await parse({
	// githubToken: process.env.GITHUB_TOKEN,
	cache: true,
	cachePath: './.cache/usage-cache.json',
	sources: [
		{
			from: [
				'github://teles/awesome-click-and-use@main:README.md',
				'github://teles/awesome-seo@main:README.md',
				'github://addyosmani/critical-path-css-tools@master:README.md',
				// "https://github.com/addyosmani/critical-path-css-tools#readme"
			],
			outputs: [
				{
					artifact: ['domain', 'index'],
					to: 'dist/{repo}-{name}.{artifact}.json',
				},
				{
					artifact: ['bookmarks'],
					to: 'dist/{repo}-{name}.{artifact}.html',
				},
				{
					artifact: ['sitemap'],
					to: 'dist/{repo}-{name}.{artifact}.xml',
				},
				{
					artifact: ['rss-json'],
					to: 'dist/{repo}-{name}.rss.json',
				},
				{
					artifact: ['rss-xml'],
					to: 'dist/{repo}-{name}.rss.xml',
				},
			],
		},
		{
			from: ['src/tests/fixtures/readmes/**/*.md'],
			outputs: [
				{
					artifact: ['domain', 'index'],
					to: 'dist/local/{dir}/{name}.{artifact}.json',
				},
			],
		},
	],
});
