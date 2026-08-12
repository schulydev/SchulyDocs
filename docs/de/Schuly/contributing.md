# Contributing

Der Contribution-Workflow ist **verbindlich** - halte dich genau daran.

## Feste Regeln

- **Nie direkt auf `main` arbeiten.** Alle Änderungen laufen über einen
  Issue-→-Branch-→-PR-Zyklus.
- **Keine AI-/Claude-Zuschreibung, niemals.** Commit-Messages, PR-Titel/-Beschreibungen
  und Issue-Texte dürfen weder AI noch Claude noch einen Assistenten erwähnen und
  dürfen keine `Co-Authored-By`- oder "Generated with"-Zeilen enthalten.
- **Keine Testpläne in PRs.** Der PR-Body besteht **nur aus Summary +
  `Closes #<issue>`**.
- **CLI-Generatoren bevorzugen**, wo immer einer existiert (`gh issue create`,
  `gh pr create` usw.), statt manueller Schritte.

## Workflow

1. **Ein gelabeltes Issue erstellen**, das die Änderung beschreibt.

   ```sh
   gh issue create --title "..." --body "..." --label <label>
   ```

2. **Von `main` abzweigen**, mit der Issue-Nummer und einem `PascalCase`-Slug:

   ```sh
   git switch -c feature/<issue#>_PascalCase   # neue Funktionalität
   git switch -c fix/<issue#>_PascalCase       # Bugfix
   ```

3. **Committen** mit einem kurzen imperativen Betreff (z. B. `Add agenda filter`).

4. **Einen PR öffnen** (gelabelt), dessen Body nur eine kurze Zusammenfassung und die
   schliessende Referenz enthält:

   ```sh
   gh pr create --title "..." --label <label> --body "Summary of the change.

   Closes #<issue>"
   ```

5. **Squash-mergen und den Branch löschen**, sobald der PR genehmigt ist.

## Branch-Benennung

| Art | Muster | Beispiel |
| --- | --- | --- |
| Feature | `feature/<issue#>_PascalCase` | `feature/123_AgendaFilter` |
| Fix | `fix/<issue#>_PascalCase` | `fix/124_LoginCrash` |

## Labels

Wende das passende Label sowohl auf das Issue als auch auf den PR an:

| Label | Verwendung für |
| --- | --- |
| `bug` | Fehlermeldungen |
| `enhancement` | Verbesserungen an bestehendem Verhalten |
| `feature` | Neue Funktionalität |
| `refactor` | Interne Umstrukturierung ohne Verhaltensänderung |
| `CI/CD` | Pipeline-/Workflow-Änderungen |
| `dependencies` | Dependency-Updates |
| `documentation` | Reine Doku-Änderungen |

## Vor dem Öffnen eines PRs

Führe die Qualitätschecks aus (siehe [Entwicklungsumgebung](setup/development.md)):

```sh
bun run analyze
bun run test
bun run format
```
