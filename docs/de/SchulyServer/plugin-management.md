# Plugin-Verwaltung

Plugins werden zur Laufzeit aus einer Registry ins Backend geladen - keine
Neu-Builds, kein manuelles Ablegen von DLLs, kein Neustart.

## Funktionsweise

- Die **Registry** (`Plugins:Registry`, standardmässig der `repo`-Branch von
  SchulyPlugins) liefert eine `index.min.json` sowie Artefakte unter `dll/`:
  `dll/<name>-v<ver>.dll` plus eine `-deps.zip` mit den privaten Abhängigkeiten des
  Plugins.
- Der **gewünschte Bestand** liegt in `plugins.yml` (`Plugins:File`). Beim Start
  gleicht das Backend ihn mit der Registry und dem Plugins-Verzeichnis ab: fehlende
  oder veraltete Plugins werden heruntergeladen, nicht mehr gelistete entfernt, und
  anschliessend werden alle geladen.
- **Hot-Swap**: Jedes Plugin läuft in seinem eigenen collectible
  `AssemblyLoadContext` mit einem eigenen Child-Service-Container. Seine Controller,
  Minimal-API-Endpunkte und Background-Tasks werden beim Laden eingebunden und beim
  Entladen wieder entfernt - der laufende Prozess wird nie neu gestartet.
  Plugin-Requests laufen im eigenen DI-Scope des Plugins (mit Fallback auf die
  Services des Hosts).

## Konfiguration

| Key | Standard | Zweck |
|---|---|---|
| `Plugins:Registry` | `repo`-Branch von SchulyPlugins | Basis-URL der Registry. |
| `Plugins:File` | `<app>/plugins.yml` | Deklarativer gewünschter Plugin-Bestand. |
| `Plugins:Directory` | `<app>/plugins` | Wo die Plugin-DLLs abgelegt werden. |
| `Plugins:ConfigDirectory` | `<app>/plugins-config` | Konfiguration `<AssemblyName>.yml` pro Plugin. |

## Admin-Endpunkte (`Administrator`)

| Methode | Route | Aktion |
|---|---|---|
| `GET` | `/api/plugins` | Geladene Plugins. |
| `GET` | `/api/plugins/registry` | In der Registry verfügbare Plugins. |
| `POST` | `/api/plugins/install` | `{ "name": "...", "version": "latest" }` - herunterladen + laden. |
| `POST` | `/api/plugins/{name}/update` | Auf die neueste Version der Registry aktualisieren. |
| `DELETE` | `/api/plugins/{name}` | Entladen + löschen. |

Jede Änderung wird im laufenden Prozess angewendet und in `plugins.yml`
persistiert, sodass sie einen Neustart übersteht. Gemeinsam genutzte
Abhängigkeits-DLLs sind referenzgezählt: Das Entfernen eines Plugins löscht nie
eine Abhängigkeit, die ein anderes Plugin noch benötigt.
