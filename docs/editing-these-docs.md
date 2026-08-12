# Editing these docs

Every page here except this one and the [getting-started](/getting-started/) walkthrough
is copied in from another repository. Editing a page on this site is therefore a matter of
finding the repo that owns it and changing the file there.

## Which repo owns a page

The first segment of the URL is the repository name.

| Page | Lives in |
|---|---|
| `/Schuly/...` | [Schuly](https://github.com/schulydev/Schuly) `docs/` |
| `/SchulyBackend/...` | [SchulyBackend](https://github.com/schulydev/SchulyBackend) `docs/` |
| `/SchulyKeycloak/...` | [SchulyKeycloak](https://github.com/schulydev/SchulyKeycloak) `docs/` |
| `/SchulyPluginAbstractions/...` | [SchulyPluginAbstractions](https://github.com/schulydev/SchulyPluginAbstractions) `docs/` |
| `/SchulyPlugins/...` | [SchulyPlugins](https://github.com/schulydev/SchulyPlugins) `docs/` |
| `/SchulyWebsite/...` | [SchulyWebsite](https://github.com/schulydev/SchulyWebsite) `docs/` |
| `/getting-started/...` | [SchulyDocs](https://github.com/schulydev/SchulyDocs) `docs/getting-started/` |

So `/SchulyBackend/setup/development` is `docs/setup/development.md` in the SchulyBackend
repository.

## How a change reaches the site

Merge your change to `main` in the source repo. A workflow there copies that repo's `docs/`
folder into SchulyDocs, and the site rebuilds on its own. It usually takes a minute or two.

Editing the copy in SchulyDocs directly does not work: the next sync replaces the whole
folder, so the change disappears.

## Things to know when writing a page

- Pages are plain GitHub-flavored Markdown. The site compiles Markdown through Vue, so a
  stray `{{ }}` or a bare `</tag>` outside a code fence will break the build.
- Diagrams are ` ```mermaid ` code blocks.
- A folder's `README.md` becomes that section's landing page.
- Link across sections with an absolute path such as `/SchulyBackend/architecture`.
  Relative links only resolve inside the same section.
