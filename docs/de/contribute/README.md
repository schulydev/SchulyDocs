# Mitwirken

Der gesamte Schuly-Code liegt auf [GitHub](https://github.com/schulydev). Issues mit dem Label `bug` oder
`feature` sind ein guter Einstieg.

## Projekt wählen

| Projekt | Stack | Hier starten |
|---|---|---|
| Mobile App | Flutter | [Entwicklungsumgebung](/de/Schuly/setup/development) |
| Server und Web-App | ASP.NET Core, Angular | [Entwicklungsumgebung](/de/SchulyServer/setup/development) |
| Plugins | .NET | [Entwicklungsumgebung](/de/SchulyPlugins/setup/development) |
| Plugin-Vertrag | .NET, NuGet | [Entwicklung](/de/SchulyPluginAbstractions/setup/development) |
| Website | Angular | [Entwicklungsumgebung](/de/SchulyWebsite/setup/development) |
| Microsoft-365-Service | Python, FastAPI | [Entwicklungsumgebung](/de/SchulyMicrosoft/setup/development) |
| Diese Dokumentation | VitePress | [Diese Dokumentation bearbeiten](/editing-these-docs) |

## Änderung vornehmen

Jedes Repository nutzt denselben Workflow:

1. Eröffne ein Issue mit Label.
2. Erstelle einen Branch von `main`, benannt `feature/<issue#>_PascalCase` oder `fix/<issue#>_PascalCase`.
3. Committe mit einem kurzen Betreff im Imperativ, zum Beispiel `Add agenda filter`.
4. Eröffne einen Pull Request mit Label. Sein Text besteht aus einer Zusammenfassung und `Closes #<issue>`,
   ohne Testplan.
5. Führe den Pull Request per Squash-Merge zusammen und lösche den Branch.

Committe nicht direkt auf `main`, und füge keine KI-Attribution zu Commits, Pull Requests oder Issues hinzu.

Die Seite **Contributing** jedes Projekts listet seine eigenen Regeln auf.

## Labels

| Label | Verwendung |
|---|---|
| `bug` | Etwas ist kaputt |
| `enhancement` | Eine Verbesserung an bestehendem Verhalten |
| `feature` | Neue Funktionen |
| `refactor` | Interne Änderungen ohne Änderung im Verhalten |
| `CI/CD` | Änderungen an Build, Release und Workflows |
| `dependencies` | Updates von Abhängigkeiten |
| `documentation` | Änderungen nur an der Dokumentation |
