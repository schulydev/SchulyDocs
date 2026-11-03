# Editing these docs

Most pages here are copied in from another repository. To change one, find the repository that
owns it and change the file there.

## Which repo owns a page

The first segment of the URL is the repository name.

| Page | Lives in |
|---|---|
| `/Schuly/...` | [Schuly](https://github.com/schulydev/Schuly) `docs/` |
| `/SchulyServer/...` | [SchulyServer](https://github.com/schulydev/SchulyServer) `docs/` |
| `/SchulyPluginAbstractions/...` | [SchulyPluginAbstractions](https://github.com/schulydev/SchulyPluginAbstractions) `docs/` |
| `/SchulyPlugins/...` | [SchulyPlugins](https://github.com/schulydev/SchulyPlugins) `docs/` |
| `/SchulyWebsite/...` | [SchulyWebsite](https://github.com/schulydev/SchulyWebsite) `docs/` |
| `/getting-started/`, `/self-host/`, `/build-plugins/`, `/contribute/` | [SchulyDocs](https://github.com/schulydev/SchulyDocs) `docs/` |
| Translations (`/de/`, `/fr/`, `/it/`) | [SchulyDocs](https://github.com/schulydev/SchulyDocs) `docs/<language>/` |

So `/SchulyServer/setup/development` is `docs/setup/development.md` in the SchulyServer
repository.

## How a change reaches the site

Merge your change to `main` in the source repo. A workflow there copies that repo's `docs/`
folder into SchulyDocs, and the site rebuilds on its own. It usually takes a minute or two.

Editing the copy in SchulyDocs directly does not work: the next sync replaces the whole
folder, so the change disappears.

## Where a page appears

The site is organized by reader: **Use Schuly**, **Self-host**, **Build plugins**, and
**Contribute**. A new page appears under Contribute. To show it to another audience, add it to
`pages` in `AUDIENCES` in `docs/.vitepress/config.mjs`.

## How to write

Readers are often in a hurry, and many read English as a second language.

- **Give each page one job.** It teaches, shows how to do a task, lists facts, or explains why.
  Split a page that does more than one.
- **Put the most important thing first.** Start with what the page helps the reader do.
- **Say "you" and use the active voice.** Write "Schuly saves your login", not "the login is saved".
- **Use short sentences and common words.** Write "use", not "utilize". Explain terms the reader may
  not know.
- **Start steps with a verb,** and put conditions first: "To add a school, open the sidebar."
- **Use sentence case in headings.** Write "Connect your school", not "Connect Your School".
- **Match the UI exactly,** and put labels in bold: **Backend URL**.
- **Leave out words that add nothing:** "simply", "just", "easy", "please", "please note", "currently".
  Leave out exclamation marks and promises about future features.
- **Link instead of copying.** Copies go stale. Link to the real file or page.

Pages for students avoid technical terms. Pages for contributors can assume the project's stack.

## Things to know when writing a page

- Pages are plain GitHub-flavored Markdown. The site compiles Markdown through Vue, so a
  stray `{{ }}` or a bare `</tag>` outside a code fence will break the build.
- Diagrams are ` ```mermaid ` code blocks.
- A folder's `README.md` becomes that section's landing page.
- Link across sections with an absolute path such as `/SchulyServer/architecture`.
  Relative links only resolve inside the same section.
