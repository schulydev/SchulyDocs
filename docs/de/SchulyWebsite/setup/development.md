# Entwicklungsumgebung

Nutze diese Seite, um die Site auf deinem Rechner zu installieren, auszuführen, zu bauen und zu testen.

## Voraussetzungen

Installiere Bun `1.2.21` oder neuer. Es ist der einzige Package Manager für dieses Projekt, und es gibt kein
`package-lock.json`.

Das Projekt nutzt das Textformat `bun.lock`, das Bun 1.1.x nicht lesen kann. `package.json` legt `bun@1.2.21` in
`packageManager` fest, und `cli.packageManager` in `angular.json` wählt Bun für die Angular CLI.

## Befehle

```sh
bun install       # install dependencies
bun start         # ng serve on http://localhost:4200
bun run watch     # ng build --watch --configuration development
bun run build     # ng build (production), then scripts/postbuild.ts
bun run test      # ng test (Karma and Jasmine)
```

Der Produktions-Build schreibt nach `dist/SchulyWebsite/browser`. Wie diese Ausgabe ausgeliefert wird, steht unter
[Deployment](deployment.md).
