# Gestione dei plugin

I plugin vengono caricati nel backend a runtime da un registro - senza rebuild,
senza copie manuali di DLL, senza riavvio.

## Come funziona

- Il **registro** (`Plugins:Registry`, di default il branch `repo` di SchulyPlugins)
  espone un `index.min.json` e gli artefatti sotto `dll/`: `dll/<name>-v<ver>.dll`
  più uno `-deps.zip` con le dipendenze private del plugin.
- Il **set desiderato** risiede in `plugins.yml` (`Plugins:File`). All'avvio il
  backend lo riconcilia con il registro e la cartella dei plugin: scarica i plugin
  mancanti o non aggiornati, rimuove quelli non più elencati, poi li carica.
- **Hot-swap**: ogni plugin viene eseguito nel proprio `AssemblyLoadContext`
  collezionabile, con un proprio contenitore di servizi figlio. I suoi controller,
  endpoint minimal-API e attività in background vengono cablati al caricamento e
  smontati allo scaricamento - il processo in esecuzione non si riavvia mai. Le
  richieste ai plugin vengono eseguite all'interno dello scope DI proprio del
  plugin (con fallback sui servizi dell'host).

## Attività in background

Un plugin dichiara un job ricorrente registrando un `IPluginBackgroundTask`: un nome,
un `PluginSchedule` (un'espressione cron più retry opzionali e `RunOnStartup`) e un
corpo `ExecuteAsync`. Il backend le esegue con il proprio scheduler: controlla ogni secondo
quali attività sono dovute, risolve l'attività per nome del plugin e dell'attività
nello scope DI del plugin e ripete un'esecuzione fallita tante volte quante lo
consente la pianificazione (a 30 secondi di distanza, salvo diversa indicazione in
`RetryIntervals`). Un'attività non si sovrappone mai a se stessa; se è ancora in
corso quando è dovuta la successiva, questa parte appena la prima è terminata.

Il cron, la prossima esecuzione, l'ultima esecuzione e i contatori di ogni attività
sono salvati nel database principale (tabella `PluginTasks`), quindi lo storico
sopravvive a un riavvio - e un'esecuzione prevista durante un fermo viene recuperata
una volta subito dopo l'avvio successivo.

Un operatore può sovrascrivere la cadenza di un'attività per plugin in
`plugins-config/<AssemblyName>.yml`:

```yaml
Schedules:
  schulware.sync-timetable:
    Cron: "0 6 * * *"
    Retries: 3
    RunOnStartup: false
```

Un override che non si riesce a interpretare (ad esempio un'espressione cron con un
errore di battitura) viene ignorato a favore del valore predefinito del plugin, invece
di mettere l'attività fuori servizio. Le stesse chiavi funzionano come variabili
d'ambiente `SCHULY_PLUGIN_<NAME>_`, come il resto della configurazione dei plugin.

`GET /api/plugins/scheduler` riporta per ogni attività il cron, l'ultima esecuzione,
la prossima esecuzione e il numero di errori.

## Configurazione

| Chiave | Predefinito | Scopo |
|---|---|---|
| `Plugins:Registry` | branch `repo` di SchulyPlugins | URL base del registro. |
| `Plugins:File` | `<app>/plugins.yml` | Set dichiarativo dei plugin desiderati. |
| `Plugins:Directory` | `<app>/plugins` | Dove vengono conservate le DLL dei plugin. |
| `Plugins:ConfigDirectory` | `<app>/plugins-config` | Configurazione `<AssemblyName>.yml` per plugin. |

## Endpoint di amministrazione (`Administrator`)

| Metodo | Rotta | Azione |
|---|---|---|
| `GET` | `/api/plugins` | Plugin caricati. |
| `GET` | `/api/plugins/scheduler` | Pianificazioni delle attività in background, ultima/prossima esecuzione, numero di errori. |
| `GET` | `/api/plugins/registry` | Plugin disponibili nel registro. |
| `POST` | `/api/plugins/install` | `{ "name": "...", "version": "latest" }` - scarica e carica. |
| `POST` | `/api/plugins/{name}/update` | Aggiorna all'ultima versione del registro. |
| `DELETE` | `/api/plugins/{name}` | Scarica ed elimina. |

Ogni modifica viene applicata in-process e salvata in `plugins.yml`, quindi
sopravvive a un riavvio. Le DLL di dipendenze condivise sono a conteggio di
riferimenti (reference-counted): rimuovere un plugin non elimina mai una
dipendenza ancora usata da un altro.
