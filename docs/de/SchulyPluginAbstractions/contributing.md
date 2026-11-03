# Contributing

Diese Regeln gelten für dieses Repo. Für Branches, Commits, Pull Requests und Labels folge dem
[gemeinsamen Workflow](/de/contribute/).

Dieses Repo ist der veröffentlichte Vertrag. Halte es deshalb klein und stabil. [Versionierung](versioning.md)
regelt fast jede Änderung. Lies diese Seite zuerst.

## Abhängigkeitsregeln

Die Abstractions-Assembly darf nur Folgendes referenzieren:

- die BCL
- die Framework-Referenz `Microsoft.AspNetCore.App`

Füge keine Referenzen auf `Schuly.Application`, `Schuly.Domain` oder `Schuly.Infrastructure` hinzu. Diese
Typen liegen in [SchulyServer](https://github.com/schulydev/SchulyServer) und sind nicht veröffentlicht.

Plugins sehen die Entitäten und den `DbContext` des Backends nie. Sie schreiben Schuldaten über
`ISchoolData` mit den schlichten Records in `SchoolRecords.cs`. Halte diese Records frei von Backend-Typen,
und füge Felder nur abwärtskompatibel hinzu.

## Versionserhöhung wählen

Das PR-Label, das du wählst, bestimmt die Release-Version. Wähle es deshalb bewusst. Zusätzlich zu den
gemeinsamen Labels nutzt dieses Repo `breaking-change`. Siehe die Tabelle unter
[Versionierung](versioning.md).
