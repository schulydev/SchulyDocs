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

Le mail di accesso (verifica, reimpostazione della password) vanno a un catcher SMTP
locale su `localhost:1025`, come impostato in `appsettings.Development.json`. Non fa
parte di `compose.dev.yml`; avviane uno, ad esempio, con:

```sh
docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
```

La casella di posta si trova su <http://localhost:8025>. I link nelle mail puntano a
`http://localhost:4200`.

## 2. Punta l'API verso di esse

Nessuna stringa di connessione è inclusa nel repository, quindi un clone appena
fatto si blocca all'avvio con `The ConnectionString property has not been
initialized.` Salva i valori locali negli
[user secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets), che
li tengono fuori da git:

```sh
cd src/Schuly.API
dotnet user-secrets set "ConnectionStrings:SchulyDatabase" "Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=d4vpas8w0rd13!!!"
dotnet user-secrets set "LocalLogin:SigningKey" "$(openssl rand -base64 32)"
dotnet user-secrets set "TwoFactor:EncryptionKey" "$(openssl rand -base64 32)"
```

La stringa di connessione non è altro che quanto già definito in `compose.dev.yml`.
Le due chiavi firmano gli access token e cifrano i segreti della verifica in due
passaggi. Una volta impostate, mantienile: una nuova chiave di firma disconnette
tutti, e una nuova chiave di cifratura rompe la verifica in due passaggi. Le variabili
d'ambiente sono un'alternativa equivalente - vedi [Configurazione](configuration.md).

## 3. Avvia l'API

```sh
cd src/Schuly.API
dotnet run --urls=http://localhost:5033
```

All'avvio l'API applica le migrazioni EF Core (`ApplyMigrations()` in
`Program.cs`) e popola il catalogo dei sistemi scolastici, così il database è
pronto già al primo avvio.

In Development, il logging delle richieste e la UI di riferimento dell'API sono
abilitati.

## Ottenere un token

Registrati tramite la web app, oppure chiama direttamente gli endpoint di accesso:

```sh
curl -X POST http://localhost:5033/auth/register -H "Content-Type: application/json" \
  -d '{"userName":"dev","email":"dev@example.com","password":"<password>"}'
curl -X POST http://localhost:5033/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"dev","password":"<password>"}'
```

La risposta del login contiene l'access token. Invialo come `Authorization: Bearer` a
`/api/*`, oppure incollalo nella UI Scalar. Vedi [Configurazione](configuration.md#accesso).

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
