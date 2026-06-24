# Contributing

This repo follows the same workflow as the other Schuly projects. It is enforced —
follow it for every change.

## Workflow

1. **Open an issue** describing the change, with an appropriate label (see below).
2. **Branch off `main`** — never work on `main` directly:
   - `feature/<issue#>_PascalCase` for features/enhancements
   - `fix/<issue#>_PascalCase` for bug fixes
3. **Open a PR** targeting `main`. The PR body is **Summary + `Closes #<issue>`**
   only — no test plans, no extra sections.
4. **Squash-merge** the PR and **delete the branch**.

## Labels

Use one of: `bug`, `enhancement`, `feature`, `refactor`, `CI/CD`, `dependencies`,
`documentation`.

## Hard rules

- **No AI / Claude attribution anywhere** — not in commits, PR titles, PR bodies, or
  issue bodies. No "Co-Authored-By", "Generated with", or similar trailers. Ever.
- Keep commit subjects short and imperative.
- Use CLI generators (`gh issue create`, `gh pr create`, …) where they exist.

## Versioning

Versions are tracked in `application.properties` and synced from the release tag by
CI — don't bump it by hand. See [Release](setup/release.md).
