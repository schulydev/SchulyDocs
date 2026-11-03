# Deployment

Auf dieser Seite siehst du, wie die Site zu Cloudflare Pages gelangt und was du prüfen musst, wenn du den Build änderst. Die
GitHub-Integration von Cloudflare übernimmt die Deploys. Sie ist im Cloudflare-Dashboard eingerichtet, nicht in einem
GitHub-Actions-Workflow.

## Was deployt wird

- Pushes auf `main` werden in die Produktion deployt.
- Pull-Request-Branches erhalten Preview-Deploys.

## Build-Einstellungen bei Cloudflare

| Einstellung | Wert |
| --- | --- |
| Build-Befehl | `bun run build` |
| Ausgabeverzeichnis | `dist/SchulyWebsite/browser` |
| Umgebung | `BUN_VERSION=1.2.21` |

Der Builder `@angular/build:application` in `angular.json` erzeugt das Ausgabeverzeichnis. Wenn du in `angular.json` den
Projektnamen, den Builder oder die Ausgabe-Einstellungen änderst, prüfe, ob der Ausgabepfad bei Cloudflare noch passt.

Das Deployment nutzt auch `public/_redirects`, `public/_headers` und die Pages Function in `functions/index.js`.

## CI

`.github/workflows/build.yml` deployt nichts. Bei Pushes und Pull Requests auf `main` führt es
`bun install --frozen-lockfile` und `bun run build` mit dem neusten Bun aus. So erkennt es kaputten Code, bevor Cloudflare einen
Preview-Deploy versucht.
