# Gestione dei plugin

I plugin collegano Schuly ai sistemi scolastici. Il tuo server li scarica da un registro, quindi non
devi copiare file a mano.

## Aggiungere o rimuovere un plugin

Modifica `config/plugins.yml` e riavvia il backend:

```yaml
plugins:
  - name: Schuly.Plugin.Schulware
    version: latest
  - name: Schuly.Plugin.Microsoft
    version: latest
  - name: Schuly.Plugin.OdaOrg
    version: latest
```

All'avvio, il server scarica ciò che è elencato e rimuove ciò che non lo è. Il sistema scolastico di
un plugin compare poi automaticamente nell'app. Non esiste un'API di amministrazione per i plugin.

### Eseguire senza Microsoft 365

1. Rimuovi `Schuly.Plugin.Microsoft` da `plugins.yml`.
2. In `compose.staging.yml`, rimuovi il servizio `schulymicrosoft` e la voce corrispondente nel
   `depends_on` del backend.

## Configurare un plugin

Ogni plugin legge `config/plugins-config/<AssemblyName>.yml`. I valori predefiniti vanno bene per la
maggior parte dei server.

- **Motivi di assenza:** imposta `AbsenceReasons` in `Schuly.Plugin.Schulware.yml`, con come chiave
  l'host dell'URL Schulnetz della scuola.
- **Servizio Microsoft:** il plugin Microsoft ha bisogno di `MicrosoftApi.BaseUrl` in
  `Schuly.Plugin.Microsoft.yml` e senza non si avvia.

## Cambiare quando viene eseguito un task

I plugin eseguono task ricorrenti, come la sincronizzazione di un orario. Per sovrascrivere la
pianificazione di un task, aggiungila al file di configurazione del plugin:

```yaml
Schedules:
  schulware.sync-timetable:
    Cron: "0 6 * * *"
    Retries: 3
    RunOnStartup: false
```

Se la pianificazione non è valida, si applica quella predefinita del plugin. Le stesse chiavi
funzionano come variabili d'ambiente `SCHULY_PLUGIN_<NAME>_`.

Schuly conserva la pianificazione e la cronologia delle esecuzioni di ogni task nella tabella
`PluginTasks`. Un'esecuzione prevista durante un periodo di inattività avviene una volta dopo l'avvio
successivo. Un task non si sovrappone mai a sé stesso.

## Impostazioni

| Chiave | Predefinito | Scopo |
|---|---|---|
| `Plugins:Registry` | Branch `repo` di SchulyPlugins | URL di base del registro |
| `Plugins:File` | `<app>/plugins.yml` | L'elenco dei plugin |
| `Plugins:Directory` | `<app>/plugins` | Dove sono salvate le DLL dei plugin |
| `Plugins:ConfigDirectory` | `<app>/plugins-config` | Dove sono salvati i file di configurazione dei plugin |

## Come funziona

Ogni plugin gira nel proprio `AssemblyLoadContext` collectible con il proprio container di servizi.
L'host collega i suoi controller, endpoint e task in background quando carica il plugin, e li rimuove
quando lo scarica. Le DLL delle dipendenze condivise hanno un conteggio dei riferimenti, quindi
rimuovere un plugin non elimina mai una DLL usata da un altro plugin.
