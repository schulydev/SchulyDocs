# SchulyDocs

Unified [VitePress](https://vitepress.dev/) site that aggregates the documentation of
every repo in the [`schulydev`](https://github.com/schulydev) org into one searchable,
cross-linkable site.

Each source repo keeps its docs next to its code in a `docs/` folder. A GitHub Actions
workflow in each repo syncs that folder into `docs/<Repo>/` here on every push to `main`,
and [Cloudflare Pages](https://pages.cloudflare.com/) rebuilds the site automatically.

> **You usually don't edit docs in this repo.** Edit `docs/` in the source repo; it
> shows up here within a minute. The only things owned here are the site config
> (`docs/.vitepress/config.mjs`) and the `docs/getting-started/` walkthrough.

## Architecture

```
source repos (Schuly, SchulyBackend, ...)        this repo (SchulyDocs)        Cloudflare Pages
  docs/**  --push to main-->  GH Action  --commit-->  docs/<Repo>/  --push-->  rebuild & deploy
```

- **One** VitePress site. Every repo's docs live under `docs/<Repo>/`, giving unified
  local search and cross-linking between sections.
- Section labels and ordering live in the `SECTIONS` map in `docs/.vitepress/config.mjs`.
  Everything inside `docs/<Repo>/` is **replaced** on each sync (so deletions in the
  source propagate) — the synced folders hold only the source repo's markdown.
- The sidebar is generated from the `docs/` tree by `config.mjs`, so contributors just
  add markdown. Each section's `README.md` is the section landing page (a `rewrites` rule
  maps `**/README.md` → `index.md`, since VitePress only treats `index.md` as a folder
  index).
- `docs/getting-started/` is an **end-user walkthrough owned by this repo** (no source
  repo syncs into it), so edit it here directly.

## Local development

Uses **bun** (never npm/node directly).

```bash
bun install
bun run dev          # dev server at http://localhost:5173
bun run build        # production build into docs/.vitepress/dist
bun run preview      # serve the production build locally
```

To preview with the latest docs from sibling repos cloned next to this one:

```bash
bash scripts/sync-docs.sh
bun run dev
```

## Hosting: Cloudflare Pages (free tier)

Cloudflare Pages has native GitHub integration; it watches this repo and rebuilds on
every push.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick `schulydev/SchulyDocs`.
2. Framework preset: **VitePress** (or **None**) and set:
   - Build command: `bun run build`
   - Build output directory: `docs/.vitepress/dist`
   - Env var: `BUN_VERSION` (keep `bun.lock` committed; Cloudflare detects bun from it).
3. Deploy. You get a `*.pages.dev` URL. Add the custom domain `docs.schuly.dev` under the
   project's **Custom domains** tab.

From then on: any push here (including the automated doc-sync commits) triggers a rebuild.

## Wiring up a source repo (one-time, per repo)

1. Copy [`templates/sync-docs.yml`](templates/sync-docs.yml) into the source repo at
   `.github/workflows/sync-docs.yml`.
2. No secret to create — it uses the org-level **`MAIN_PUSH_TOKEN`** secret already used
   by the other cross-repo sync workflows in this org.
3. Push a change under `docs/` (or run the workflow manually). The workflow opens a PR
   against this repo and auto-merges it (matching the org's sync convention), which
   triggers the Cloudflare Pages rebuild.

To add a brand-new repo's section: add an entry to the `SECTIONS` array in
`docs/.vitepress/config.mjs` (its `dir` and display `text`) and add the repo to the list
in `scripts/sync-docs.sh`.

## Notes / limitations

- Source docs are plain GitHub-flavored Markdown. VitePress compiles markdown through Vue,
  so raw `{{ }}` or stray HTML-like `</tag>` lines in a `.md` file will break the build —
  keep such content inside code fences.
- Mermaid ```mermaid code blocks render via `vitepress-plugin-mermaid`.
- Nested folders (e.g. `setup/`) become collapsible sub-groups labeled by folder name.
- Cross-section links should use absolute site paths (e.g. `/SchulyBackend/architecture`)
  or full GitHub URLs; relative links only resolve within the same section.
