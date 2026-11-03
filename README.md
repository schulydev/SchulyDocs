# SchulyDocs

> Looking for the docs themselves? They're at **[docs.schuly.dev](https://docs.schuly.dev)**.

You usually don't edit pages here. Each repo keeps its docs next to its code, and a workflow copies them in on every push to `main`:

```
source repo  docs/**  -->  this repo  docs/<Repo>/  -->  Cloudflare Pages
```

[Which repo owns a page](https://docs.schuly.dev/editing-these-docs) tells you where to go. Only the site config, the audience pages (`getting-started`, `self-host`, `build-plugins`, `contribute`) and the translations live here.

## Preview

```sh
bun install
bash scripts/sync-docs.sh   # optional: copy docs from repos cloned next to this one
bun run dev                 # http://localhost:5173
```

## Add a repo

Copy [`templates/sync-docs.yml`](templates/sync-docs.yml) to the repo's `.github/workflows/`, then add the repo to `SECTIONS` in `docs/.vitepress/config.mjs` and to `scripts/sync-docs.sh`.

Cloudflare Pages builds with `bun run build` into `docs/.vitepress/dist`.

Licensed under [PolyForm Noncommercial 1.0.0](LICENSE).
