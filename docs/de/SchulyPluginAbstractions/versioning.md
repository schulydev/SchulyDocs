# Versionierung

Dieses Package ist ein veröffentlichter Vertrag, daher gilt strikte Semver-Versionierung. Der
ganze Sinn des Repos ist Stabilität: Plugins referenzieren das Package, und der Host stellt die
Assembly zur Laufzeit bereit - eine unbedachte Änderung bricht damit jedes Plugin im Feld.

## Regeln

| Änderung | Sprung | PR-Label |
|---|---|---|
| Eine Methodensignatur ändern, eine Methode zu einem bestehenden Interface hinzufügen oder ein Mitglied umbenennen | **MAJOR** | `breaking-change` |
| Ein neues optionales Interface oder eine Default-implementierte Methode hinzufügen | **MINOR** | `feature` |
| Doku-/Metadaten-/Packaging-Anpassungen | **PATCH** | *(Standard - kein Label nötig)* |

## Wie die Version bestimmt wird

- `application.properties` enthält die aktuelle `<version>`; sie ist die Single Source of
  Truth und wird von `src/Directory.Build.props` beim Build/Pack in `$(Version)` eingelesen.
- **release-drafter** (`.github/release-drafter.yml`) bestimmt die *nächste* Version anhand
  der Labels auf gemergten PRs: `breaking-change` → major, `feature` → minor, alles andere →
  patch. Es entwirft ausserdem den Changelog.
- Das Release schneiden führt anschliessend den Publish-Ablauf aus, der
  `application.properties` vor dem Packen mit dem Tag synchronisiert. Siehe
  [Veröffentlichung](setup/publishing.md).

## Stabilität der Assembly-Version

`Directory.Build.props` pinnt die **Assembly**-Version auf `MAJOR.MINOR.0.0` (während
`FileVersion`/`InformationalVersion` die vollständige Version tragen). Ein Plugin, das gegen
ein beliebiges `MAJOR.MINOR.x` gebaut wurde, bindet an eine einzige `MAJOR.MINOR.0.0`-Assembly,
sodass Patch-Sprünge keinen Rebuild jedes Plugins erzwingen und keine Type-Load-Fehler über
Patch-Versionen hinweg verursachen. Nur ein **MINOR- oder MAJOR**-Sprung ändert die
Bindungs-Assembly-Version - ein weiterer Grund, die Tabelle oben genau zu befolgen.
