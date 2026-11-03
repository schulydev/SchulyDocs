# Development setup

Use this page to install, run, build, and test the site on your machine.

## Prerequisites

Install Bun `1.2.21` or newer. It's the only package manager for this project, and there is no
`package-lock.json`.

The project uses the text `bun.lock` format, which Bun 1.1.x can't read. `package.json` pins
`bun@1.2.21` in `packageManager`, and `cli.packageManager` in `angular.json` selects Bun for the
Angular CLI.

## Commands

```sh
bun install       # install dependencies
bun start         # ng serve on http://localhost:4200
bun run watch     # ng build --watch --configuration development
bun run build     # ng build (production), then scripts/postbuild.ts
bun run test      # ng test (Karma and Jasmine)
```

The production build writes to `dist/SchulyWebsite/browser`. See [Deployment](deployment.md) for how
that output is served.
