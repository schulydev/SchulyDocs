# Contributing

Der folgende Ablauf ist **verbindlich** - niemals direkt auf `main` committen.

## Ablauf

1. **Eröffne ein Issue mit Label**, das die Änderung beschreibt. Wähle das passende Label
   (z. B. `new-plugin` für ein neues Plugin, dazu `bug` / `enhancement` / `documentation` / etc.).
2. **Branch** von `main` abzweigen: `feature/<issue#>_PascalCase` oder `fix/<issue#>_PascalCase`.
3. **Committen** mit einem kurzen, imperativen Betreff (z. B. `Add OdaOrg vacation sync`).
4. **PR eröffnen**, der das Issue verlinkt. Der PR-Body besteht **nur aus Summary +
   `Closes #<issue>`** - keine Testpläne.
5. **Squash-Merge**, danach den Branch löschen.

## Feste Regeln

- **Keine KI-/Claude-Attribution, nirgends - niemals.** Weder in Commit-Messages, PR-Titeln/-Bodies
  noch im Issue-Text. Keine `Co-Authored-By`-Trailer, keine "Generated with"-Zeilen.
- Nutze CLI-Generatoren, wo es einen gibt (`gh issue create`, `gh pr create`,
  `dotnet ef migrations add`, `kiota`, …).
- Halte Änderungen fokussiert: Der veröffentlichte Distributions-Index liest `Version` /
  `Description` / `Authors` aus der csproj jedes Plugins - erhöhe also `<Version>`, wenn du das
  Verhalten eines Plugins änderst.

## Siehe auch

- [adding-a-plugin.md](adding-a-plugin.md) - Gerüst + Lebenszyklus.
- [migrations.md](migrations.md) - EF-Core-Migrationen.
- [setup/kiota-client.md](setup/kiota-client.md) - den Schulware-Client neu generieren.
- [setup/distribution.md](setup/distribution.md) - wie Merges nach `main` ausgeliefert werden.
