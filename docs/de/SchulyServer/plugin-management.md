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

## Background-Tasks

Ein Plugin deklariert einen wiederkehrenden Job, indem es einen
`IPluginBackgroundTask` registriert: einen Namen, einen `PluginSchedule` (einen
Cron-Ausdruck plus optionale Retries und `RunOnStartup`) und einen
`ExecuteAsync`-Body. Das Backend führt diese Tasks mit seinem eigenen Scheduler aus: Es
prüft jede Sekunde, welche Tasks fällig sind, löst den Task per Plugin- und Task-Name
im eigenen DI-Scope des Plugins auf und wiederholt einen fehlgeschlagenen Lauf so oft,
wie der Zeitplan es erlaubt (im Abstand von 30 Sekunden, sofern `RetryIntervals`
nichts anderes vorgibt). Ein Task überschneidet sich nie mit sich selbst; läuft er
noch, wenn der nächste Lauf fällig ist, startet dieser erst danach.

Cron, nächster Lauf, letzter Lauf und Laufzähler jedes Tasks liegen in der
Hauptdatenbank (Tabelle `PluginTasks`). Die Historie übersteht so einen Neustart, und
ein Lauf, der während einer Ausfallzeit fällig war, wird direkt nach dem nächsten
Start einmal nachgeholt.

Ein Betreiber kann den Takt eines Tasks pro Plugin in
`plugins-config/<AssemblyName>.yml` überschreiben:

```yaml
Schedules:
  schulware.sync-timetable:
    Cron: "0 6 * * *"
    Retries: 3
    RunOnStartup: false
```

Ein Override, der sich nicht parsen lässt (etwa ein vertippter Cron-Ausdruck), wird
ignoriert, und es gilt der eigene Standard des Plugins. Der Task geht dadurch nicht
offline. Dieselben Keys funktionieren als Umgebungsvariablen `SCHULY_PLUGIN_<NAME>_`,
wie der Rest der Plugin-Konfiguration.

`GET /api/plugins/scheduler` meldet für jeden Task Cron, letzten Lauf, nächsten Lauf
und Fehlerzähler.

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
| `GET` | `/api/plugins/scheduler` | Zeitpläne der Background-Tasks, letzter/nächster Lauf, Fehlerzähler. |
| `GET` | `/api/plugins/registry` | In der Registry verfügbare Plugins. |
| `POST` | `/api/plugins/install` | `{ "name": "...", "version": "latest" }` - herunterladen + laden. |
| `POST` | `/api/plugins/{name}/update` | Auf die neueste Version der Registry aktualisieren. |
| `DELETE` | `/api/plugins/{name}` | Entladen + löschen. |

Jede Änderung wird im laufenden Prozess angewendet und in `plugins.yml`
persistiert, sodass sie einen Neustart übersteht. Gemeinsam genutzte
Abhängigkeits-DLLs sind referenzgezählt: Das Entfernen eines Plugins löscht nie
eine Abhängigkeit, die ein anderes Plugin noch benötigt.
