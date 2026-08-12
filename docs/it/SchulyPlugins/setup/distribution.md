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

## Installazione (per gli operatori)

Gli artefatti precompilati vengono serviti da
`raw.githubusercontent.com/schulydev/SchulyPlugins/repo`. Scaricali nella cartella
`/app/plugins/` del backend:

```sh
BASE=https://raw.githubusercontent.com/schulydev/SchulyPlugins/repo
NAME=Schuly.Plugin.Schulware
VERSION=2.4.2

# 1. DLL del plugin
curl -L "$BASE/dll/$NAME-v$VERSION.dll" -o /app/plugins/$NAME.dll

# 2. Le sue dipendenze di terze parti
curl -L "$BASE/dll/$NAME-v$VERSION-deps.zip" -o /tmp/deps.zip
unzip -o /tmp/deps.zip -d /app/plugins/

# 3. Collocare il file Schuly.Plugin.<Name>.yml del plugin nella plugins-config/ del backend
```

Il backend fornisce già gli assembly del framework e quelli condivisi dall'host, quindi solo la
DLL del plugin e le sue dipendenze di terze parti incluse devono finire in `plugins/`.
`index.min.json` è il catalogo che i client leggono per scoprire i plugin e le versioni
disponibili.
