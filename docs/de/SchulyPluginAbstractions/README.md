# Schuly.Plugin.Abstractions - Dokumentation

`Schuly.Plugin.Abstractions` ist der **stabile Plugin-Vertrag** für das
[Schuly-Backend](https://github.com/schulydev/SchulyBackend), veröffentlicht auf NuGet.org
als [`Schuly.Plugin.Abstractions`](https://www.nuget.org/packages/Schuly.Plugin.Abstractions).
Plugin-Autoren referenzieren das Package und implementieren dessen Interfaces; der Plugin-Host
des Backends entdeckt die Implementierung und führt sie aus. Dieses Repo ist bewusst **klein
und stabil** - der Vertrag ändert sich selten und unterliegt strikter Semver, damit Plugins,
die gegen einen Host gebaut wurden, nicht bei einem anderen brechen.

## Inhalt

- [Vertragsreferenz](contract.md) - jedes Interface und jeder Record, mit den echten Signaturen
  und wo jedes Mitglied im Plugin-Lebenszyklus einzuordnen ist.
- [Setup](setup/) - lokale Entwicklung und Veröffentlichung:
  - [Entwicklung](setup/development.md) - Voraussetzungen, Build, lokaler Pack-Dry-Run.
  - [Veröffentlichung](setup/publishing.md) - der NuGet-Release-Ablauf und die Package-Metadaten.
- [Versionierung](versioning.md) - strikte Semver-Regeln und die Labels, die Releases steuern.
- [Contributing](contributing.md) - der verbindliche Issue-→-Branch-→-PR-Workflow und die
  Dependency-Regeln, an die sich dieses Repo hält.
