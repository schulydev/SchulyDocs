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
corpo `ExecuteAsync`. Il backend non lascia mai che un plugin parli direttamente con
TickerQ: possiede un'unica funzione ticker lato host che inoltra allo scope DI del
plugin per nome del plugin e dell'attività. Questa indirezione esiste perché un
assembly di plugin viene caricato a runtime in un `AssemblyLoadContext`
collezionabile; un `[TickerFunction]` dichiarato al suo interno non verrebbe mai visto
dal source generator di TickerQ, che gira solo alla compilazione dell'host.

La pianificazione di ogni attività viene salvata nel database principale (lo schema
`ticker` di TickerQ), non tenuta in memoria, quindi la pianificazione, la prossima
esecuzione e lo storico delle esecuzioni sopravvivono a un riavvio - e un'esecuzione
prevista durante un fermo non viene saltata in silenzio.

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
la prossima esecuzione e il numero di errori. La dashboard di TickerQ è montata su
`/tickerq` solo in Development.

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
