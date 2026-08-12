# Deployment

Die Seite läuft auf **Cloudflare Pages**. Das Deployment läuft über die
**Cloudflare-GitHub-Integration** (konfiguriert im Cloudflare-Dashboard, **nicht**
über einen GitHub-Actions-Workflow in diesem Repo).

## Production-Deploys

- Pushes auf **`main`** werden von Cloudflare Pages automatisch deployt.
- **PR-Branches** erhalten über dieselbe Integration automatisch **Preview-Deploys**.

## Cloudflare-Build-Einstellungen

| Einstellung | Wert |
|---|---|
| Build-Befehl | `bun run build` |
| Output-Verzeichnis | `dist/SchulyWebsite/browser` |
| Umgebung | `BUN_VERSION=1.2.21` |

Der Build verwendet den `@angular/build:application`-Builder (siehe `angular.json`),
der das Verzeichnis `dist/SchulyWebsite/browser` erzeugt, das Cloudflare
ausgeliefert wird. **Wenn du `angular.json` änderst** (Projektname, Builder oder
Output-Einstellungen), prüfe, ob der Cloudflare-Output-Pfad noch übereinstimmt.

## CI vs. Deployment

`.github/workflows/build.yml` ist **unabhängig** vom Deployment. Er führt bei Pushes
und PRs auf `main` nur `bun install --frozen-lockfile` + `bun run build` aus, um zu
prüfen, dass der Build durchläuft - und deckt so kaputten Code auf, bevor Cloudflare
einen Preview-Deploy versucht. Er selbst veröffentlicht nichts.

## Siehe auch

- [Entwicklungsumgebung](development.md)
- [Release](release.md)
