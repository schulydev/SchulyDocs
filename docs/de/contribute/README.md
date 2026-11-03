# Mitwirken

Der gesamte Code von Schuly liegt auf [GitHub](https://github.com/schulydev). Issues mit dem Label
`bug` oder `feature` eignen sich gut für den Einstieg.

## Projekt wählen

| Projekt | Stack | Starte hier |
|---|---|---|
| Mobile App | Flutter | [Entwicklungs-Setup](/de/Schuly/setup/development) |
| Server und Web-App | ASP.NET Core, Angular | [Entwicklungs-Setup](/de/SchulyServer/setup/development) |
| Plugins | .NET | [Entwicklungs-Setup](/de/SchulyPlugins/setup/development) |
| Plugin-Vertrag | .NET, NuGet | [Entwicklungs-Setup](/de/SchulyPluginAbstractions/setup/development) |
| Website | Angular | [Entwicklungs-Setup](/de/SchulyWebsite/setup/development) |
| Diese Dokumentation | VitePress | [Diese Dokumentation bearbeiten](/editing-these-docs) |

## Änderung vornehmen

Jedes Repository nutzt denselben Ablauf:

1. Eröffne ein Issue mit Label.
2. Erstelle von `main` aus einen Branch mit dem Namen `feature/<issue#>_PascalCase` oder `fix/<issue#>_PascalCase`.
3. Committe mit einem kurzen Betreff im Imperativ, zum Beispiel `Add agenda filter`.
4. Eröffne einen Pull Request mit Label. Sein Text besteht aus einer Zusammenfassung und `Closes #<issue>`, ohne Testplan.
5. Führe den Pull Request per Squash-Merge zusammen und lösche den Branch.

Committe nicht direkt auf `main` und füge Commits, Pull Requests oder Issues keine KI-Attribution hinzu.

Die Seite **Contributing** jedes Projekts nennt dessen eigene Regeln.

## Labels

| Label | Verwendung |
|---|---|
| `bug` | Etwas, das kaputt ist |
| `enhancement` | Eine Verbesserung an bestehendem Verhalten |
| `feature` | Neue Funktionalität |
| `refactor` | Interne Änderungen ohne Änderung im Verhalten |
| `CI/CD` | Änderungen an Build, Release und Workflows |
| `dependencies` | Updates von Abhängigkeiten |
| `documentation` | Änderungen nur an der Dokumentation |
