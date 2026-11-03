# Setup di sviluppo

Usa questa pagina per eseguire l'API, l'app web e le loro dipendenze sul tuo computer.

## Prerequisiti

- .NET 10 SDK
- Docker
- Bun, per l'app web
- Facoltativo: lo strumento `dotnet-ef` per le [migrazioni](../migrations.md)
  (`dotnet tool install --global dotnet-ef`)

## 1. Avvia le dipendenze

```sh
docker compose -f compose.dev.yml up -d
```

| Servizio | Immagine | Porta host | Note |
|---|---|---|---|
| Postgres | `postgres:18.1` | `2406` | Database `schuly-dev` |
| SeaweedFS | `chrislusf/seaweedfs:latest` | `8333`, `9333`, `8888` | API S3, UI master, filer |
| SchulwareAPI | `ghcr.io/pianonic/schulwareapi:latest` | `8000` | Ponte verso Schulnetz per il plugin Schulware |

Le mail di accesso, come quelle di verifica e di reimpostazione della password, vanno a un catcher SMTP su `localhost:1025`, come
impostato in `appsettings.Development.json`. `compose.dev.yml` non ne include uno, quindi avvialo tu:

```sh
docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
```

La posta in arrivo è su [http://localhost:8025](http://localhost:8025). I link nelle mail puntano a
`http://localhost:4200`.

## 2. Punta l'API verso di esse

Il repository non include una stringa di connessione, quindi un clone nuovo si ferma all'avvio con
`The ConnectionString property has not been initialized.` Memorizza i valori locali negli
[user secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets), che li tengono fuori da
git:

```sh
cd src/Schuly.API
dotnet user-secrets set "ConnectionStrings:SchulyDatabase" "Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=d4vpas8w0rd13!!!"
dotnet user-secrets set "LocalLogin:SigningKey" "$(openssl rand -base64 32)"
dotnet user-secrets set "TwoFactor:EncryptionKey" "$(openssl rand -base64 32)"
```

La stringa di connessione riprende `compose.dev.yml`. Le due chiavi firmano gli access token e cifrano i
segreti dell'autenticazione a due fattori. Conservale una volta impostate: una nuova chiave di firma disconnette tutti, e una nuova
chiave di cifratura rompe l'autenticazione a due fattori. Puoi usare invece le variabili d'ambiente. Vedi
[Configurazione](configuration.md).

Per usare documenti e avatar, imposta anche le chiavi `S3:` e `Avatar:SigningKey`. Le credenziali S3 di sviluppo
sono in `scripts/seaweedfs/s3-config.json`.

In Development, il server si avvia senza `Vault:MasterKey` e `Documents:EncryptionKey`. Usa quindi
chiavi temporanee, così le credenziali memorizzate dei plugin e i documenti cifrati non sopravvivono a un riavvio.

## 3. Avvia l'API

```sh
cd src/Schuly.API
dotnet run --urls=http://localhost:5033
```

All'avvio, l'API applica le migrazioni EF Core e inizializza il catalogo dei sistemi scolastici, quindi il database è
pronto alla prima esecuzione. In Development, attiva anche il logging delle richieste e la UI di riferimento dell'API.

## 4. Avvia l'app web

```sh
cd src/Schuly.Frontend
bun install
bun start        # ng serve on http://localhost:4200
```

`proxy.conf.json` inoltra `/api` e `/auth` a `http://127.0.0.1:5033`.

## Ottieni un token

Registrati tramite l'app web, oppure chiama gli endpoint di accesso:

```sh
curl -X POST http://localhost:5033/auth/register -H "Content-Type: application/json" \
  -d '{"userName":"dev","email":"dev@example.com","password":"<password>"}'
curl -X POST http://localhost:5033/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"dev","password":"<password>"}'
```

`appsettings.json` imposta `LocalLogin:RequireVerifiedEmailForSignIn` a `true`, quindi verifica l'indirizzo
tramite la mail nella posta in arrivo prima di accedere.

La risposta del login contiene l'access token. Invialo come `Authorization: Bearer` a `/api/*`, oppure incollalo
nella UI di Scalar. Vedi [Configurazione](configuration.md#sign-in).

## Riferimento API

- **UI di Scalar:** [http://localhost:5033/scalar](http://localhost:5033/scalar)
- **Documento OpenAPI 3.0:**
  [http://localhost:5033/openapi/v1.json](http://localhost:5033/openapi/v1.json). Lo produce
  `Microsoft.AspNetCore.OpenApi` integrato, e da esso viene generato il client Dart.

## Esegui i test

```sh
dotnet test
```

La suite è [TUnit](https://tunit.dev/), che funziona su Microsoft.Testing.Platform. Il .NET 10 SDK non
esegue più questi progetti tramite VSTest, quindi `global.json` attiva la modalità MTP per il repository. Senza di esso,
`dotnet test` fallisce con `Testing with VSTest target is no longer supported`.

Per eseguire direttamente il progetto:

```sh
dotnet run --project src/Schuly.Tests
```

Per testare l'app web:

```sh
cd src/Schuly.Frontend
bun run test --watch=false
bun run e2e                 # playwright test
```
