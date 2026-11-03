# Plugin-Verwaltung

Plugins verbinden Schuly mit Schulsystemen. Dein Server lädt sie aus einer Registry herunter, du
kopierst also keine Dateien von Hand.

## Plugin hinzufügen oder entfernen

Bearbeite `config/plugins.yml` und starte das Backend neu:

```yaml
plugins:
  - name: Schuly.Plugin.Schulware
    version: latest
  - name: Schuly.Plugin.Microsoft
    version: latest
  - name: Schuly.Plugin.OdaOrg
    version: latest
```

Beim Start lädt der Server herunter, was aufgeführt ist, und entfernt, was nicht aufgeführt ist. Das
Schulsystem eines Plugins erscheint danach automatisch in der App. Es gibt keine Admin-API für Plugins.

### Ohne Microsoft 365 betreiben

1. Entferne `Schuly.Plugin.Microsoft` aus `plugins.yml`.
2. Entferne in `compose.staging.yml` den Dienst `schulymicrosoft` und den zugehörigen Eintrag in
   `depends_on` des Backends.

## Plugin konfigurieren

Jedes Plugin liest `config/plugins-config/<AssemblyName>.yml`. Die Standardwerte funktionieren für
die meisten Server.

- **Absenzgründe:** Setze `AbsenceReasons` in `Schuly.Plugin.Schulware.yml`, mit dem Host der
  Schulnetz-URL der Schule als Schlüssel.
- **Microsoft-Dienst:** Das Microsoft-Plugin braucht `MicrosoftApi.BaseUrl` in
  `Schuly.Plugin.Microsoft.yml` und startet ohne diesen Wert nicht.

## Ausführungszeit eines Tasks ändern

Plugins führen wiederkehrende Tasks aus, zum Beispiel die Synchronisation eines Stundenplans. Um den
Zeitplan eines Tasks zu überschreiben, füge ihn der Konfigurationsdatei des Plugins hinzu:

```yaml
Schedules:
  schulware.sync-timetable:
    Cron: "0 6 * * *"
    Retries: 3
    RunOnStartup: false
```

Wenn sich der Zeitplan nicht parsen lässt, gilt der Standard des Plugins. Dieselben Schlüssel
funktionieren als Umgebungsvariablen `SCHULY_PLUGIN_<NAME>_`.

Schuly speichert Zeitplan und Laufhistorie jedes Tasks in der Tabelle `PluginTasks`. Ein Lauf, der
während einer Ausfallzeit fällig war, läuft nach dem nächsten Start einmal. Ein Task überschneidet
sich nie mit sich selbst.

## Einstellungen

| Key | Standard | Zweck |
|---|---|---|
| `Plugins:Registry` | `repo`-Branch von SchulyPlugins | Basis-URL der Registry |
| `Plugins:File` | `<app>/plugins.yml` | Die Liste der Plugins |
| `Plugins:Directory` | `<app>/plugins` | Wo Plugin-DLLs gespeichert werden |
| `Plugins:ConfigDirectory` | `<app>/plugins-config` | Wo Plugin-Konfigurationsdateien gespeichert werden |

## So funktioniert es

Jedes Plugin läuft in seinem eigenen collectible `AssemblyLoadContext` mit eigenem Service-Container.
Der Host bindet seine Controller, Endpunkte und Background-Tasks beim Laden des Plugins ein und
entfernt sie beim Entladen. Gemeinsam genutzte Abhängigkeits-DLLs sind referenzgezählt: Das Entfernen
eines Plugins löscht nie eine DLL, die ein anderes Plugin nutzt.
