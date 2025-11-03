import { parse }  from "@/api/index";

await parse({
  // githubToken: process.env.GITHUB_TOKEN,
  sources: [
    {
      from: [
        "github://teles/awesome-click-and-use@main:README.md",
        "github://teles/awesome-seo@main:README.md",
      ],
      outputs: [
        {
          artifact: ["domain", "index"],
          to: "dist/{repo}-{name}.{artifact}.json",
        },
        {
          artifact: ["bookmarks"],
          to: "dist/{repo}-{name}.{artifact}.html",
        },
      ],
    },
    {
      from: ["src/tests/fixtures/readmes/**/*.md"],
      outputs: [
        {
          artifact: ["domain", "index"],
          to: "dist/local/{dir}/{name}.{artifact}.json",
        },
      ],
    },
  ],
});