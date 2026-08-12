# Contributing

Dieses Repo ist der **stabile veröffentlichte Vertrag**. Halte ihn klein, halte ihn stabil.
Nahezu jede Änderung unterliegt der [Versionierung](versioning.md) - lies das zuerst.

## Dependency-Regeln

Die Abstractions-Assembly darf **ausschliesslich** referenzieren:

- die BCL, und
- die Framework-Referenz `Microsoft.AspNetCore.App`.

Füge **keine** Referenzen auf `Schuly.Application` hinzu (diese Typen leben in
[SchulyBackend](https://github.com/schulydev/SchulyBackend) und werden nicht veröffentlicht).

> Das Repo liefert die Backend-DLLs `Schuly.Domain.dll` und `Schuly.Infrastructure.dll` als
> vorgebaute Binaries unter `src/Schuly.Plugin.Abstractions/libs/` aus (synchronisiert vom
> Backend), damit Plugins typisierten DB-Zugriff erhalten; die EF-Core-Packages, die diese
> DLLs benötigen, sind in der csproj deklariert. Mach daraus keine Projektreferenzen und ziehe
> keinen weiteren Backend-Quellcode in dieses Repo.

## Workflow (verbindlich)

1. **Ein gelabeltes Issue eröffnen**, das die Änderung beschreibt. Verwende das richtige
   Label, damit release-drafter die nächste Version korrekt bestimmt (`breaking-change`,
   `feature`, `documentation`, `CI/CD`, `dependencies`, `bug`, `refactor`).
2. **Von `main` abzweigen**: `feature/<issue#>_PascalCase` oder `fix/<issue#>_PascalCase`.
   Nie direkt auf `main` committen.
3. **Einen PR öffnen** mit `Closes #<issue>`. Der PR-Body besteht **nur aus Summary +
   `Closes #<issue>`** - keine Testpläne.
4. **Squash-mergen** und den Branch löschen.

Commit-Betreffs sind kurz und im Imperativ gehalten.

## Keine AI-Zuschreibung

Füge niemals AI-/Assistenten-Zuschreibungen hinzu - weder in Commit-Messages, PR-Beschreibungen
noch Issue-Texten. Keine `Co-Authored-By`-Trailer, keine "generated with"-Zeilen. Niemals.

## Den passenden Versionssprung wählen

Siehe die Tabelle in [Versionierung](versioning.md). Das PR-Label, das du wählst, steuert die
Release-Version - wähle es also bewusst.
