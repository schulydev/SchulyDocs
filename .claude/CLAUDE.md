# Notes for Claude (and humans) — SchulyDocs

Unified Docusaurus docs site for Schuly, served at docs.schuly.dev. It aggregates each schulydev repo's `docs/` via CI sync — edit docs in the source repos, not here. See `README.md` for the sync + hosting setup. Built with **bun**.

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
