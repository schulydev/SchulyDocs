# Contributing

Diese Seite enthält die Regeln und Prüfungen speziell für den Server. Für Issues, Branches, Pull Requests und Labels folge
dem [gemeinsamen Workflow](/de/contribute/).

## Code-Regeln

- Halte die [Schichtregeln](architecture.md#schichtregeln) ein: `Schuly.Application` darf `Schuly.Infrastructure` nicht
  referenzieren.
- Halte Controller schlank. Sie delegieren an Mediator, und die Handler enthalten die Logik.
- Füge Tests zu `Schuly.Tests` hinzu, wo es sinnvoll ist.
- Halte Signaturen von Deklarationen auf einer Zeile, egal wie lang sie sind. Brich die Parameterliste eines `record`, einer
  `class` oder eines `struct` mit Primary Constructor, einer Methode oder eines Konstruktors nicht um. Lass Methodenketten,
  LINQ-Queries und mehrzeilige Bedingungen umgebrochen.
- Nutze Bun für Frontend-Tasks, nicht npm, npx oder node.
- Beschränke den Commit-Text auf das, was sich geändert hat und warum.

## Versionierung

Erhöhe `application.properties` in Feature-Pull-Requests nicht von Hand. Das Veröffentlichen eines Releases gleicht die
Datei mit dem Tag ab. Siehe [Images und Releases](setup/production.md).

## Prüfungen

CI führt diese bei jedem Pull Request aus. So führst du sie selbst aus:

```sh
dotnet restore Schuly.API.slnx
dotnet build Schuly.API.slnx -c Release --no-restore -warnaserror
dotnet test Schuly.API.slnx -c Release --no-build
```

```sh
cd src/Schuly.Frontend
bun install --frozen-lockfile
bun run build
bun run test --watch=false
```

CI baut auch das Sandbox-Image, wenn ein Pull Request `src/Schuly.Sandbox/**` ändert.
