# Distribuzione

I plugin seguono il modello a due branch in stile **Aniyomi**:

- `main` - i progetti sorgente C# dei plugin.
- `repo` - le DLL compilate più un indice leggibile da macchina, tutto generato automaticamente.

## Il workflow di compilazione + pubblicazione

`.github/workflows/build_push.yml` viene eseguito sui push a `main` che toccano
`src/Schuly.Plugin.*/**` (o il workflow stesso), oltre che su avvio manuale. Ha tre job:

1. **discover** - esegue il glob di `src/**/Schuly.Plugin.*.csproj` e genera una matrice di
   build. Una nuova cartella di plugin con un csproj viene rilevata senza modifiche al workflow.
2. **build** (per plugin) - `dotnet publish -c Release`, poi prepara:
   - `dll/<AssemblyName>-v<Version>.dll` - l'assembly del plugin, distribuita in modo autonomo
     così gli operatori possono fissarne la versione o sostituirla indipendentemente.
   - `dll/<AssemblyName>-v<Version>-deps.zip` - le sue dipendenze di terze parti. Gli assembly
     forniti dall'host vengono esclusi (ASP.NET Core, EF Core, Npgsql, Mediator e gli assembly
     host di Schuly, incluso `Schuly.Plugin.Abstractions`); vengono incluse solo le vere
     dipendenze NuGet di terze parti (Kiota, AngleSharp, …). Un plugin senza dipendenze riceve
     uno zip solo segnaposto, così lo schema dell'indice resta uniforme.
   - un JSON di metadati per plugin (`name`, `pkg`, `dll`, `deps`, `version`, `description`,
     `authors`), letto dal csproj tramite `dotnet msbuild -getProperty`.
3. **publish** - unisce i JSON dei singoli plugin in un `index.json` (ordinato per nome) e un
   `index.min.json` minificato, copia le DLL + gli zip delle dipendenze e fa il commit di tutto
   sul branch `repo`.

`AssemblyName`, `Version`, `Description` e `Authors` provengono quindi direttamente dal
`PropertyGroup` del `.csproj` di ciascun plugin - tienili aggiornati.

## Installazione

I server scaricano automaticamente i plugin da questo branch. Gli operatori elencano i plugin che vogliono in
`plugins.yml`. Vedi [Gestione dei plugin](/it/SchulyServer/plugin-management). `index.min.json` è il catalogo
che i server leggono per trovare plugin e versioni.
