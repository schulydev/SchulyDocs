# Distribuzione

Questa pagina spiega come i plugin passano da `main` a un server. I plugin usano il modello a due branch
in stile Aniyomi:

- `main` contiene i progetti sorgente C# dei plugin.
- `repo` contiene le DLL compilate e un indice leggibile dalle macchine, tutti generati automaticamente.

## Il workflow di build e pubblicazione

[`build_push.yml`](https://github.com/schulydev/SchulyPlugins/blob/main/.github/workflows/build_push.yml)
viene eseguito sui push a `main` che toccano `src/Schuly.Plugin.*/**` o il workflow stesso, e all'avvio manuale.
Una modifica solo in `src/Shared/` non lo avvia.

Ha tre job:

1. **discover** trova ogni `src/<folder>/Schuly.Plugin.*.csproj` ed emette una matrice di build. Una nuova cartella
   di plugin con un csproj non richiede modifiche al workflow.
2. **build** esegue `dotnet publish -c Release` per ogni plugin, poi prepara:
   - `dll/<AssemblyName>-v<Version>.dll`: l'assembly del plugin.
   - `dll/<AssemblyName>-v<Version>-deps.zip`: le sue dipendenze di terze parti, come Kiota o AngleSharp.
     Lo zip lascia fuori `Microsoft.AspNetCore.*`, `Microsoft.Extensions.*`,
     `Microsoft.EntityFrameworkCore.*`, `Npgsql.*`, `Mediator.*` e `Schuly.Plugin.Abstractions.dll`,
     che fornisce il server. Un plugin senza dipendenze ottiene uno zip con solo un marcatore, così lo schema dell'indice
     resta uniforme.
   - Un JSON di metadati per il plugin con `name`, `pkg`, `dll`, `deps`, `version`, `contract`,
     `description` e `authors`. `contract` è il MAJOR.MINOR di `Schuly.Plugin.Abstractions` che il
     plugin ha risolto. `name`, `version`, `description` e `authors` vengono dal csproj tramite
     `dotnet msbuild -getProperty`.
3. **publish** unisce i file JSON in `index.json`, ordinato per nome, e in un `index.min.json` minificato.
   Poi sostituisce `dll/` ed entrambi i file di indice sul branch `repo` e fa il commit. Il branch contiene solo
   le build dell'ultima esecuzione.

`AssemblyName`, `Version`, `Description` e `Authors` vengono dal csproj di ogni plugin, quindi tienili
aggiornati.

## Installa un plugin

I server scaricano automaticamente i plugin dal branch `repo`. Gli operatori elencano i plugin che vogliono in
`plugins.yml`. Vedi [Gestione dei plugin](/it/SchulyServer/plugin-management). `index.min.json` è il catalogo
che i server leggono per trovare plugin e versioni.
