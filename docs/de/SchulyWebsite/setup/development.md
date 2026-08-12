# Entwicklungsumgebung

## Voraussetzungen

- **Bun `1.2.21+`** - das ist der einzige Paketmanager für dieses Projekt. Es gibt
  **kein npm und keine `package-lock.json`**.
  - Die Version wird über `packageManager` in `package.json` und
    `cli.packageManager` in `angular.json` festgelegt.
  - Die Version spielt eine Rolle: Das Projekt nutzt das **textbasierte
    `bun.lock`**-Lockfile-Format, das Bun 1.1.x nicht lesen kann. Verwende 1.2.21
    oder neuer.

## Installieren

```sh
bun install
```

## Starten

```sh
bun start            # ng serve auf http://localhost:4200
```

## Watch (fortlaufender Dev-Build)

```sh
bun run watch        # ng build --watch --configuration development
```

## Production-Build

```sh
bun run build        # ng build (production) + scripts/postbuild.ts
```

Der Production-Build wird nach `dist/SchulyWebsite/browser` ausgegeben. Siehe
[Deployment](deployment.md) dazu, wie diese Ausgabe ausgeliefert wird.

## Testen

```sh
bun run test         # ng test (Karma + Jasmine)
```

## Siehe auch

- [Deployment](deployment.md)
- [Architektur & Coding-Konventionen](../architecture.md)
- [Contributing](../contributing.md)
