# Contributing

## Verbindlicher Workflow

**Arbeite nie direkt auf `main`.** Jede Änderung folgt diesem Ablauf:

1. **Eröffne ein gelabeltes Issue**, das die Änderung beschreibt.
2. **Branch** von `main` abzweigen: `feature/<issue#>_PascalCase` oder `fix/<issue#>_PascalCase`.
3. **Öffne einen PR**, der mit `Closes #<issue>` auf das Issue verweist.
   - Der PR-Body besteht **nur aus Summary + `Closes #<issue>`**. Keine Testpläne.
4. **Squash-mergen** und den Branch löschen.

### PR-Labels

`bug`, `enhancement`, `feature`, `refactor`, `CI/CD`, `dependencies`, `documentation`.

### Commit-Messages

- Kurzer, imperativer Betreff (z. B. `Add FAQ section`).

## Absolute Regel

**Keine KI-/Claude-Attribution, nirgends** - weder in Commits, PR-Bodies noch Issues.
Niemals. Kein `Co-Authored-By`, "Generated with" oder Ähnliches.

## Coding-Standards

Halte dich an die **Angular-20-Coding-Konventionen**, die in
[architecture.md](architecture.md#angular-20-coding-konventionen) dokumentiert sind.

## Siehe auch

- [Entwicklungsumgebung](setup/development.md)
- [Deployment](setup/deployment.md)
- [Release](setup/release.md)
