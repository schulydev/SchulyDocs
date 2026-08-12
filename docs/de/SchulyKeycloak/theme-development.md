# Theme-Entwicklung

Das gebrandete Login-Theme liegt in `keycloakify/`. Es ist ein
[Keycloakify](https://keycloakify.dev)-11-Projekt (React 18 + Vite + Tailwind CSS 4,
mit shadcn-artigen UI-Komponenten unter `src/components/ui`). Die Vite-Konfiguration
benennt das Theme `schuly` und baut nur das Login-Theme
(`accountThemeImplementation: "none"`).

## Toolchain

- **Bun** ist der Paketmanager (eine `bun.lock` ist committet). Dependencies mit
  `bun install` installieren.
- Node-Engine: `^18 || >=20` (das Build-Image nutzt Node 22).
- **Maven** wird von Keycloakify benötigt, um das Provider-JAR zu packen (die
  Docker-Theme-Stage installiert es).

Skripte (`keycloakify/package.json`):

| Skript | Was es tut |
|---|---|
| `bun run dev` | Vite-Dev-Server für schnelle Iteration am Theme. |
| `bun run build` | `tsc && vite build`. |
| `bun run build-keycloak-theme` | `build`, dann `keycloakify build` - erzeugt die Provider-JAR(s). |
| `bun run storybook` | Storybook (`-p 6006`) zum isolierten Vorschauen der Login-Seiten. |
| `bun run format` | Prettier. |

> Die Storybook-Konfiguration liegt unter `keycloakify/.storybook/`. Nutze sie, um
> Login-Seiten ohne laufendes Keycloak zu entwickeln.

## Lokale Theme-Iteration

```sh
cd keycloakify
bun install
bun run dev          # or: bun run storybook
```

## Wie das Theme ins Image gelangt

Das Theme ist **keine** Runtime-Abhängigkeit, die du separat installierst - es wird
ins Image eingebacken. In der ersten Stage des `Dockerfile` (`node:22` + Maven) wird
das Theme mit `npm run build-keycloak-theme` gebaut, und die resultierende
`dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar` wird in die
Keycloak-Builder-Stage kopiert als
`/opt/keycloak/providers/schuly-keycloak-theme.jar`. Das optimierte `kc.sh build`
backt es anschliessend ins finale Image ein. Das Realm wählt es über
`loginTheme: "schuly"` aus.

> Die Docker-Theme-Stage verwendet `npm install` / `npm run build-keycloak-theme`. Die
> committete `bun.lock` ist für die lokale Entwicklung gedacht; der Image-Build
> verlässt sich nicht darauf.

Baue das Image nach einer Theme-Änderung neu (`docker compose -f compose.dev.yml up
--build`), um sie in der laufenden Konsole zu sehen.
