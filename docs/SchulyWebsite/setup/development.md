# Development setup

## Prerequisites

- **Bun `1.2.21+`** - this is the only package manager for the project. There is
  **no npm and no `package-lock.json`**.
  - The version is pinned via `packageManager` in `package.json` and
    `cli.packageManager` in `angular.json`.
  - The version matters: the project uses the **text `bun.lock`** lockfile format,
    which Bun 1.1.x cannot read. Use 1.2.21 or newer.

## Install

```sh
bun install
```

## Run

```sh
bun start            # ng serve on http://localhost:4200
```

## Watch (continuous dev build)

```sh
bun run watch        # ng build --watch --configuration development
```

## Production build

```sh
bun run build        # ng build (production) + scripts/postbuild.ts
```

The production build emits to `dist/SchulyWebsite/browser`. See
[deployment](deployment.md) for how that output is served.

## Test

```sh
bun run test         # ng test (Karma + Jasmine)
```

## Related

- [Deployment](deployment.md)
- [Architecture & coding conventions](../architecture.md)
- [Contributing](../contributing.md)
