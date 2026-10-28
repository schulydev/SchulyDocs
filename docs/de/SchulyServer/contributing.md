# Mitwirken

Ein kurzer, verbindlicher Workflow hält die Historie sauber und releasefähig.

## Workflow

1. **Ein beschriftetes Issue eröffnen**, das die Änderung beschreibt. Ein Label aus
   der Taxonomie unten anwenden.
2. **Von `main` branchen**: `feature/<issue#>_PascalCase` oder
   `fix/<issue#>_PascalCase`. Nie direkt auf `main` committen.
3. **Einen PR eröffnen** (ebenfalls beschriftet), der auf `main` zielt. Der PR-Body
   besteht aus **Summary** plus `Closes #<issue>` - sonst nichts (keine Testpläne).
4. **Squash-mergen** und den Branch löschen.

## Commit-Nachrichten

- Kurzer, imperativer Betreff (z. B. `Add absences endpoint`).
- Kein Rauschen im Body; fokussiert auf das Was/Warum.

## Labels

Ein Label passend zur Org-Taxonomie verwenden:

| Label | Verwendung für |
|---|---|
| `bug` | Ein Defekt / fehlerhaftes Verhalten. |
| `enhancement` | Verbesserung an bestehendem Verhalten. |
| `feature` | Neue Funktionalität. |
| `refactor` | Interne Umstrukturierung, keine Verhaltensänderung. |
| `CI/CD` | Build-, Release- und Workflow-Änderungen. |
| `dependencies` | Aktualisierungen von Abhängigkeiten. |
| `documentation` | Reine Doku-Änderungen. |

## Versionierung

`application.properties` ist die einzige Quelle der Wahrheit für die Version und
wird beim Veröffentlichen eines Releases automatisch mit dem Release-Tag
synchronisiert - siehe [Produktion](setup/production.md). In Feature-PRs nicht von
Hand hochsetzen.

## Erwartungen an den Code

- Die [Schichtenregeln](architecture.md) respektieren: `Schuly.Application` darf
  nicht auf `Schuly.Infrastructure` verweisen.
- Controller bleiben schlank und delegieren an Mediator; die Logik steckt in den
  Handlern.
- Tests in `Schuly.Tests` ergänzen, wo es sinnvoll ist.
