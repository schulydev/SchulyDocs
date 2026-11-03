# Contributing

Diese Regeln gelten für dieses Repo. Für Branches, Commits, Pull Requests und Labels folge dem
[gemeinsamen Workflow](/de/contribute/).

## Labels

Dieses Repo ergänzt die gemeinsamen Labels um diese:

| Label | Verwendung |
|---|---|
| `new-plugin` | Ein Vorschlag oder Grundgerüst für ein neues Plugin |
| `plugin: example`, `plugin: schulware`, `plugin: odaorg`, `plugin: microsoft` | Änderungen an diesem Plugin |

## Regeln

- Nutze einen CLI-Generator, wo es einen gibt: `gh issue create`, `gh pr create`, `dotnet ef migrations add`, `kiota`.
- Erhöhe `<Version>` in der csproj des Plugins, wenn du das Verhalten des Plugins änderst. Der veröffentlichte Index
  liest `Version`, `Description` und `Authors` aus jeder csproj, und Server vergleichen die Version, um über ein Update
  zu entscheiden.

## Verwandte Seiten

- [Plugin hinzufügen](adding-a-plugin.md)
- [EF-Core-Migrationen](migrations.md)
- [Kiota-Client](setup/kiota-client.md)
- [Distribution](setup/distribution.md): wie Merges nach `main` ausgeliefert werden
