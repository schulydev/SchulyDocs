# Versionierung

Nutze diese Seite, um die richtige Versionserhöhung für eine Vertragsänderung zu wählen.

Dieses Package folgt strikt Semver. Plugins referenzieren das Package, und der Host stellt die Assembly zur
Laufzeit bereit. Eine unbedachte Änderung bricht deshalb jedes Plugin im Einsatz.

## Regeln

| Änderung | Erhöhung | PR-Label |
|---|---|---|
| Methodensignatur ändern, Methode zu einem bestehenden Interface hinzufügen oder Member umbenennen | **MAJOR** | `breaking-change` |
| Neues optionales Interface oder Methode mit Standardimplementierung hinzufügen | **MINOR** | `feature` |
| Dokumentation, Metadaten oder kleine Packaging-Anpassungen | **PATCH** | Keines nötig |

## Wie die Version ermittelt wird

- `application.properties` enthält die aktuelle `<version>`. Sie ist die einzige Quelle.
  `src/Directory.Build.props` liest sie beim Bauen und Packen in `$(Version)` ein.
- **release-drafter** (`.github/release-drafter.yml`) ermittelt die nächste Version aus den Labels
  zusammengeführter PRs und entwirft das Changelog:
  - `breaking` oder `breaking-change`: major
  - `feature`, `enhancement` oder `minor`: minor
  - alles andere: patch
- Das Erstellen des Releases startet den Publish-Ablauf. Er gleicht `application.properties` vor dem Packen
  mit dem Tag ab. Siehe [Veröffentlichung](setup/publishing.md).

## Stabilität der Assembly-Version

`Directory.Build.props` legt die Assembly-Version auf `MAJOR.MINOR.0.0` fest. `FileVersion` und
`InformationalVersion` tragen die volle Version.

Ein Plugin, das gegen ein beliebiges `MAJOR.MINOR.x` gebaut ist, bindet an eine `MAJOR.MINOR.0.0`-Assembly.
Patch-Erhöhungen erzwingen keinen Rebuild jedes Plugins und verursachen keine Type-Load-Fehler zwischen
Patch-Versionen. Nur eine MINOR- oder MAJOR-Erhöhung ändert die gebundene Assembly-Version. Das ist ein
weiterer Grund, der Tabelle oben genau zu folgen.

## Vor 1.0

Solange die Version `0.x` ist, erhöht ein Breaking Change MINOR (`0.3` auf `0.4`) statt MAJOR. Erstelle das
Release mit einem expliziten `gh release create v0.<next>.0`, nicht mit der Version, die release-drafter bei
einem `breaking-change`-Label vorschlägt.

## Kompatibilität beim Laden

Das Backend vergleicht die `Schuly.Plugin.Abstractions`-Assembly-Version, gegen die ein Plugin gebaut wurde,
mit seiner eigenen. Es lehnt ein inkompatibles Plugin mit einer klaren Log-Meldung ab. So schlägt das Plugin
nicht später mit einem Type-Load-Fehler fehl.

| Vertrag des Hosts | Ein Plugin ist kompatibel, wenn |
|---|---|
| `1.x` und neuer | es dieselbe MAJOR hat und seine MINOR nicht neuer ist als die des Hosts |
| `0.x` | es dieselbe MAJOR.MINOR hat |

Während `0.x` brauchen Plugins also nach jedem MINOR-Release einen Rebuild.
