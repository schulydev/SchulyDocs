# Setup di sviluppo

Esegui l'API e le sue dipendenze in locale.

## Prerequisiti

- **.NET 10 SDK**
- **Docker** (per Postgres; il file compose di sviluppo avvia anche SeaweedFS e
  un'istanza locale di SchulwareAPI)
- Facoltativo: lo strumento globale `dotnet-ef` per le [migrazioni](../migrations.md)
  (`dotnet tool install --global dotnet-ef`)

## 1. Avvia le dipendenze

```sh
docker compose -f compose.dev.yml up -d
```

`compose.dev.yml` avvia:

- **Postgres** (`postgres:18.1`) sulla porta host `2406`, database `schuly-dev`.
- **SeaweedFS** S3 (storage dei documenti) sulla porta `8333`.
- **SchulwareAPI** (bridge Schulnetz usato dal plugin Schulware) sulla porta `8000`.

## 2. Punta l'API verso di esse

Nessuna stringa di connessione è inclusa nel repository, quindi un clone appena
fatto si blocca all'avvio con `The ConnectionString property has not been
initialized.` Salva i valori locali negli
[user secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets), che
li tengono fuori da git:

```sh
cd src/Schuly.API
dotnet user-secrets set "ConnectionStrings:SchulyDatabase" "Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=d4vpas8w0rd13!!!"
dotnet user-secrets set "Oidc:Authority" "http://localhost:8080/realms/schuly"
```

La stringa di connessione non è altro che quanto già definito in `compose.dev.yml`.
`Oidc:Authority` non viene usato per il login mentre `DevAuth` è abilitato, ma il
documento OpenAPI pubblicizza gli endpoint OAuth dell'authority, quindi
**`/openapi/v1.json` fallisce con 500 finché non viene impostato** - e la UI
Scalar risulta vuota perché carica quel documento. Qualsiasi valore che punti al
tuo Keycloak funziona. Le variabili d'ambiente sono un'alternativa equivalente -
vedi [Configurazione](configuration.md).

## 3. Avvia l'API

```sh
cd src/Schuly.API
dotnet run --urls=http://localhost:5033
```

All'avvio l'API applica le migrazioni EF Core (`ApplyMigrations()` in
`Program.cs`) e popola il catalogo dei sistemi scolastici, così il database è
pronto già al primo avvio.

In Development, il logging delle richieste e la UI di riferimento dell'API sono
abilitati, e un percorso opzionale di finto-OIDC (`DevAuth`) ti permette di
generare token locali tramite `/api/dev/token` invece di contattare un identity
provider reale. Vedi [Configurazione](configuration.md).

## Riferimento API

- **UI Scalar**: <http://localhost:5033/scalar>
- **Documento OpenAPI 3.0**: <http://localhost:5033/openapi/v1.json> (il client
  Dart viene generato a partire da questo documento)

Il documento OpenAPI è prodotto dal `Microsoft.AspNetCore.OpenApi` integrato.

## Test

```sh
dotnet test
```

La suite è [TUnit](https://tunit.dev/), che gira su Microsoft.Testing.Platform.
Il .NET 10 SDK non esegue più quei progetti tramite il vecchio percorso VSTest,
quindi `global.json` fa passare il repository alla modalità MTP - senza di esso
`dotnet test` fallisce con *"Testing with VSTest target is no longer supported"*.
Per eseguire il progetto direttamente:

```sh
dotnet run --project src/Schuly.Tests
```
