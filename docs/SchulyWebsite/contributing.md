# Contributing

## Enforced workflow

**Never work directly on `main`.** Every change follows this flow:

1. **Open a labeled issue** describing the change.
2. **Branch** off `main`: `feature/<issue#>_PascalCase` or `fix/<issue#>_PascalCase`.
3. **Open a PR** that references the issue with `Closes #<issue>`.
   - PR body is **Summary + `Closes #<issue>` only**. No test plans.
4. **Squash-merge** and delete the branch.

### PR labels

`bug`, `enhancement`, `feature`, `refactor`, `CI/CD`, `dependencies`, `documentation`.

### Commit messages

- Short imperative subject (e.g. `Add FAQ section`).

## Absolute rule

**No AI / Claude attribution anywhere** - not in commits, PR bodies, or issues.
Ever. No `Co-Authored-By`, "Generated with", or similar trailers.

## Coding standards

Follow the **Angular 20 coding conventions** documented in
[architecture.md](architecture.md#angular-20-coding-conventions).

## Related

- [Development setup](setup/development.md)
- [Deployment](setup/deployment.md)
- [Release](setup/release.md)
