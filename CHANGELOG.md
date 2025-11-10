# 1.0.0 (2025-11-10)


### Bug Fixes

* **.gitignore:** add .env to ignore list ([e92f7e5](https://github.com/awesome-pages/parser/commit/e92f7e50fb9dc9681c00c9a1f13abdc95e5cf1e3))
* **cli:** use source.id() instead of input string ([84ad0ad](https://github.com/awesome-pages/parser/commit/84ad0ad3f10282c3ef767001818e80b70a508b41)), closes [#5](https://github.com/awesome-pages/parser/issues/5)
* **config:** correct biome.json configuration for v2.3.2 ([d457b88](https://github.com/awesome-pages/parser/commit/d457b88167c7bf6f5a52d25ed12f84ce6a412763))
* **core:** extract description when title is provided in frontmatter ([b79b48c](https://github.com/awesome-pages/parser/commit/b79b48c2e4780212172c9ac3a6172a882aa8df5c))
* **helpers:** correct regex in extractInlineTags to handle spaces around tags ([0337b15](https://github.com/awesome-pages/parser/commit/0337b151ea104898ccf9841afffd348002a6d4a0)), closes [#14](https://github.com/awesome-pages/parser/issues/14)
* mock GitHub token resolution in cache tests ([bed2139](https://github.com/awesome-pages/parser/commit/bed2139e37c38d710f3f3054280af25bd1c87c4e)), closes [#11](https://github.com/awesome-pages/parser/issues/11)
* **rss:** correct RFC 822 day of week in test expectations ([5b522b0](https://github.com/awesome-pages/parser/commit/5b522b06a1558028de001bd422545bf61935fee4))
* **sources:** preserve 304 status in cache after fresh content fetch ([142a767](https://github.com/awesome-pages/parser/commit/142a767f315de31e84a81ab031c34c0131e3a546))
* **stopwords:** update TypeScript ignore directive for stopwords-iso package ([74f1567](https://github.com/awesome-pages/parser/commit/74f1567ccb9b4c6477c660aba77e0dd081b32809))


### Features

* add awesome-pages-markers remark plugin ([1ae6746](https://github.com/awesome-pages/parser/commit/1ae67469d7ae9324acdfd56f4a165cd4d5f9fea1))
* add domain v1 schema with zod validation ([0df6308](https://github.com/awesome-pages/parser/commit/0df6308243f52b50929dbf9ca0918912eeb9a89b))
* add markdown parser with metadata extraction ([42124ae](https://github.com/awesome-pages/parser/commit/42124ae92b9b1aef2b49d0c8cd9bfab7dc65f8c7))
* add mdast to domain transformer ([7728135](https://github.com/awesome-pages/parser/commit/7728135b79f1ef71caa227f2572d5832203d830e))
* add public API exports for NPM package ([cc06f14](https://github.com/awesome-pages/parser/commit/cc06f14194565d55dcf3c7ce0656ddf089e05447)), closes [#13](https://github.com/awesome-pages/parser/issues/13)
* add slugify helper for generating url-safe identifiers ([a0f51a9](https://github.com/awesome-pages/parser/commit/a0f51a996457d01405d108205a3460dfc8718d77))
* **api:** add cache configuration options ([a42e04a](https://github.com/awesome-pages/parser/commit/a42e04a4551b1c868e191cc1c23fb19b0afecd3d)), closes [#23](https://github.com/awesome-pages/parser/issues/23)
* **api:** add high-level parse API for multi-source processing ([7e530d2](https://github.com/awesome-pages/parser/commit/7e530d2cad14687d972b3552db58057cd266c719)), closes [hi#level](https://github.com/hi/issues/level) [#18](https://github.com/awesome-pages/parser/issues/18)
* **api:** add sitemap, rss-json and rss-xml artifact types ([6c88bae](https://github.com/awesome-pages/parser/commit/6c88baed97a26379e29dbe5bf13e738695f9d537))
* **api:** integrate bookmarks generator in parse runner ([9d8fdaf](https://github.com/awesome-pages/parser/commit/9d8fdaf59bbc7ec8c334d7291c4b6d3bacb6a9d2))
* **api:** integrate buildIndex into parseRunner for index artifact ([4d2de25](https://github.com/awesome-pages/parser/commit/4d2de256ebcc4f61b62ad442f9ff13af04bd0f7a)), closes [#7](https://github.com/awesome-pages/parser/issues/7)
* **api:** integrate cache manager in parseRunner ([b7bbb8c](https://github.com/awesome-pages/parser/commit/b7bbb8ce91d873d2034e93a6ea4205fe1d432ed6)), closes [#23](https://github.com/awesome-pages/parser/issues/23)
* **api:** integrate descriptionHtml in parse pipeline ([#9](https://github.com/awesome-pages/parser/issues/9)) ([66f3934](https://github.com/awesome-pages/parser/commit/66f3934c4351328c2a99a5d75600fd1f5177d5a2))
* **api:** integrate new artifacts into parse runner ([e6127f8](https://github.com/awesome-pages/parser/commit/e6127f8412703fb7b885caee0bd056ffc41a9507))
* **artifacts:** add RSS feed generators ([e9aa962](https://github.com/awesome-pages/parser/commit/e9aa9628cecae9726ae2c34302e420f456269df4))
* **artifacts:** add sitemap XML generator ([806cedc](https://github.com/awesome-pages/parser/commit/806cedcd19e3eed8d9db6049b54d250b40f966ac))
* **bookmarks:** implement Chrome-compatible bookmarks HTML generator ([51040a3](https://github.com/awesome-pages/parser/commit/51040a39460561f1a090972646d2674ed35eddea))
* **cache:** add cache types and interface definitions ([8ecd9a0](https://github.com/awesome-pages/parser/commit/8ecd9a04043f10085ef9b3f7c5f27aa143e34cf4)), closes [#23](https://github.com/awesome-pages/parser/issues/23)
* **cache:** add CacheManager implementation ([44f9e0a](https://github.com/awesome-pages/parser/commit/44f9e0ae67e31201e988472c680f18c649af827b)), closes [#23](https://github.com/awesome-pages/parser/issues/23)
* **cli:** add CLI entrypoint ([a25f4c7](https://github.com/awesome-pages/parser/commit/a25f4c78e5e9b026ceac536e4dfe13618a7b03d2))
* **cli:** integrate remote source support ([44e960f](https://github.com/awesome-pages/parser/commit/44e960fe728400db5cf6e53f2ea67b6de0a84a9b)), closes [#5](https://github.com/awesome-pages/parser/issues/5) [#6](https://github.com/awesome-pages/parser/issues/6)
* **core:** add stats and structured meta to search index ([60e56da](https://github.com/awesome-pages/parser/commit/60e56dac9e36af6e5d18ef887e7ba10e068988a0)), closes [#7](https://github.com/awesome-pages/parser/issues/7)
* **core:** implement search index builder with tokenization ([03be22c](https://github.com/awesome-pages/parser/commit/03be22ce63b2588432e53073ca081f3959dbc257)), closes [#7](https://github.com/awesome-pages/parser/issues/7)
* **domain:** define Zod schemas and TypeScript types ([e02ceab](https://github.com/awesome-pages/parser/commit/e02ceab343fca5fef3d5626d407b4f45a7621e27))
* **helpers:** add extractInlineTags function for parsing inline tags from descriptions ([60f385c](https://github.com/awesome-pages/parser/commit/60f385ccd962422282aa17504cde867a170fd324)), closes [#14](https://github.com/awesome-pages/parser/issues/14)
* **index:** integrate language-specific stopwords in tokenizer ([2f90f2e](https://github.com/awesome-pages/parser/commit/2f90f2ee952e99ff9eb230850891ef55babe0a4c))
* **language:** add language detection with franc-min ([2344cde](https://github.com/awesome-pages/parser/commit/2344cde38069a43430dde24613dc7503344f14ac))
* **normalize:** add AST to domain transformer ([1aca760](https://github.com/awesome-pages/parser/commit/1aca760541c5827814c38c5688812e941b8df5b1))
* **parse:** add markdown to AST parser ([c989ec5](https://github.com/awesome-pages/parser/commit/c989ec58eb935976930e6e9762325c6ced3300f0))
* **parser:** add $schema property to domain output ([c635364](https://github.com/awesome-pages/parser/commit/c635364514a9cb7441e36e1c5640fa19d288bf87)), closes [#8](https://github.com/awesome-pages/parser/issues/8)
* **parser:** add escapeHtml utility function ([5b9bef5](https://github.com/awesome-pages/parser/commit/5b9bef57990f394488b610e85490919bcb77646c)), closes [#9](https://github.com/awesome-pages/parser/issues/9)
* **parser:** generate descriptionHtml alongside description ([#9](https://github.com/awesome-pages/parser/issues/9)) ([040ec3f](https://github.com/awesome-pages/parser/commit/040ec3f59aaf111f18152f0d2e9e875252511fba))
* **parser:** integrate inline tag extraction into mdastToDomain ([bcd1dc9](https://github.com/awesome-pages/parser/commit/bcd1dc9c283fdcea6d99b6d9f03219cd8e83f40f)), closes [#14](https://github.com/awesome-pages/parser/issues/14)
* **parser:** integrate language extraction and detection pipeline ([7be6a30](https://github.com/awesome-pages/parser/commit/7be6a306c31262318ba5ff1a85672d365c53ed3f))
* **plugins:** add remark metadata plugin ([0cc7740](https://github.com/awesome-pages/parser/commit/0cc77406de6afcab72d84fce403c1f136279e96f))
* prevent title collision with deterministic suffix strategy ([364efa6](https://github.com/awesome-pages/parser/commit/364efa62bd73bc9c5e3ebe3e064a88d5fc66d9a0)), closes [#2](https://github.com/awesome-pages/parser/issues/2)
* **schema:** add descriptionHtml field to domain schema ([cecfcc1](https://github.com/awesome-pages/parser/commit/cecfcc1d7d33122bfa86cee16bdf9ac4d6c6557c)), closes [#9](https://github.com/awesome-pages/parser/issues/9)
* **schema:** add JSON schema for awesome-list v1 ([7ae10f0](https://github.com/awesome-pages/parser/commit/7ae10f0a8b0126b75de9606ffc0f820618b8a3ed))
* **schema:** add JSON Schema generation from Zod domain schema ([e2b601d](https://github.com/awesome-pages/parser/commit/e2b601d6a4305ab138d90cfba97d9d3f454c5070)), closes [#8](https://github.com/awesome-pages/parser/issues/8)
* **schema:** add optional language field to domain meta ([1715796](https://github.com/awesome-pages/parser/commit/171579641273fad327b341a5bc5b002a45588952))
* **schema:** add script to generate publishable JSON Schema ([2c11519](https://github.com/awesome-pages/parser/commit/2c1151903f67747b007de808c1ce5074712874be)), closes [#8](https://github.com/awesome-pages/parser/issues/8)
* **sources:** add cache tracking for local files ([7080a98](https://github.com/awesome-pages/parser/commit/7080a98bfb1aa72f878837217ce92f7f3fc26b61)), closes [#23](https://github.com/awesome-pages/parser/issues/23)
* **sources:** add GitHub remote source support ([7496660](https://github.com/awesome-pages/parser/commit/7496660c4c915f846b53783e70111a1003d4924f)), closes [#6](https://github.com/awesome-pages/parser/issues/6)
* **sources:** add source abstraction layer ([358289d](https://github.com/awesome-pages/parser/commit/358289d249eefecc5bb24b1276d342f4722bc380)), closes [#6](https://github.com/awesome-pages/parser/issues/6)
* **sources:** add source factory with URI parsing ([ec40673](https://github.com/awesome-pages/parser/commit/ec40673916d03a387c3ba2001003a2228267c3f4)), closes [#6](https://github.com/awesome-pages/parser/issues/6)
* **sources:** add support for HTTP raw sources ([e20a392](https://github.com/awesome-pages/parser/commit/e20a392ed69caa8d0b4af13d765d258ecb98e4c7)), closes [#6](https://github.com/awesome-pages/parser/issues/6)
* **sources:** implement GitHub API conditional requests ([60b7388](https://github.com/awesome-pages/parser/commit/60b7388809867772130eb44bb0998089c1ce8201)), closes [#23](https://github.com/awesome-pages/parser/issues/23)
* **sources:** implement HTTP conditional requests with ETag/Last-Modified ([571cbad](https://github.com/awesome-pages/parser/commit/571cbad8add6a0c84f8d83dfd739f9e824cf8315)), closes [#23](https://github.com/awesome-pages/parser/issues/23)
* **stopwords:** add language-specific stopwords with tech whitelist ([eae5d06](https://github.com/awesome-pages/parser/commit/eae5d0652e8b8d99e79e50205dea0b5ae82c1d3f))
* **utils:** add slug utility function ([9b55ab1](https://github.com/awesome-pages/parser/commit/9b55ab1c7f1f31de58e6dd2226e2c4a219ec0493))

# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Initial release preparation
- Public API surface defined
- ESM/CJS dual build configuration
- Automated semantic-release setup
