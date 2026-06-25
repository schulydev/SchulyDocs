# Notes for Claude (and humans) — SchulyDocs

Unified VitePress docs site for Schuly, served at docs.schuly.dev. It aggregates each schulydev repo's `docs/` via CI sync — edit docs in the source repos, not here. Site config + sidebar/section labels live in `docs/.vitepress/config.mjs`. See `README.md` for the sync + hosting setup. Built with **bun** (`bun run dev` / `bun run build`).

## Workflow rules (enforced)

- Never work on `main`. Create an issue (labeled) → branch `feature/<issue#>_PascalCase`
  or `fix/<issue#>_PascalCase` → PR (labeled) with `Closes #<issue>` → squash-merge +
  delete branch.
- Use **bun** as the package manager / task runner — never npm, npx, or node directly.
- Use CLI tooling whenever one exists (`gh issue create`, `gh pr create`, generators, etc.).
- No AI / Claude attribution in commits or PRs. Ever.
- No test plans in PRs. PR body is **Summary** + `Closes #<issue>` only.
- Commit subject: short imperative.
- PR labels: `bug`, `enhancement`, `feature`, `refactor`, `CI/CD`, `dependencies`, `documentation`.

## Code formatting

**Declaration signatures go on one line** - in any JS/TS config or script here, don't wrap a function / arrow parameter list across multiple lines, however long it gets. Fluent chains, object / array literals, and multi-line conditionals stay wrapped as they are.
