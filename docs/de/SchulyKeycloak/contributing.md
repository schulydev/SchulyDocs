# Contributing

Dieses Repo folgt demselben Workflow wie die anderen Schuly-Projekte. Er ist
verbindlich - halte dich bei jeder Änderung daran.

## Workflow

1. **Ein Issue erstellen**, das die Änderung beschreibt, mit einem passenden Label
   (siehe unten).
2. **Von `main` abzweigen** - niemals direkt auf `main` arbeiten:
   - `feature/<issue#>_PascalCase` für Features/Verbesserungen
   - `fix/<issue#>_PascalCase` für Bugfixes
3. **Einen PR öffnen**, der auf `main` zielt. Der PR-Body besteht **nur aus Summary +
   `Closes #<issue>`** - keine Testpläne, keine zusätzlichen Abschnitte.
4. **Squash-mergen** und **den Branch löschen**.

## Labels

Verwende eines von: `bug`, `enhancement`, `feature`, `refactor`, `CI/CD`,
`dependencies`, `documentation`.

## Feste Regeln

- **Keine AI-/Claude-Zuschreibung, nirgendwo** - nicht in Commits, PR-Titeln,
  PR-Beschreibungen oder Issue-Texten. Kein "Co-Authored-By", kein "Generated with"
  oder Ähnliches. Niemals.
- Commit-Betreffe kurz und im Imperativ halten.
- CLI-Generatoren (`gh issue create`, `gh pr create`, …) verwenden, wo sie existieren.

## Versionierung

Versionen werden in `application.properties` geführt und von CI mit dem Release-Tag
synchronisiert - nicht von Hand hochzählen. Siehe [Release](setup/release.md).
