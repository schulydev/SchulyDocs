# Contributing

Use this page for the rules and checks specific to the website. For issues, branches, pull requests,
and labels, follow the [shared workflow](/contribute/).

## Rules

- Use Bun for everything, not npm, npx, or node.
- Follow the [Angular 20 coding conventions](architecture.md#angular-20-coding-conventions).
- When you add a language or a page, update `scripts/postbuild.ts`. See
  [Routes and languages](architecture.md#routes-and-languages).

## Checks

CI runs these on pushes and pull requests to `main`. Run them before you open a pull request:

```sh
bun install --frozen-lockfile
bun run build
```

Run the unit tests as well. CI doesn't run them.

```sh
bun run test
```
