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
| `GET` | `/api/plugins/registry` | Plugin disponibili nel registro. |
| `POST` | `/api/plugins/install` | `{ "name": "...", "version": "latest" }` - scarica e carica. |
| `POST` | `/api/plugins/{name}/update` | Aggiorna all'ultima versione del registro. |
| `DELETE` | `/api/plugins/{name}` | Scarica ed elimina. |

Ogni modifica viene applicata in-process e salvata in `plugins.yml`, quindi
sopravvive a un riavvio. Le DLL di dipendenze condivise sono a conteggio di
riferimenti (reference-counted): rimuovere un plugin non elimina mai una
dipendenza ancora usata da un altro.
