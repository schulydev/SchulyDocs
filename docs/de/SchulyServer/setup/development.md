# Entwicklungsumgebung

Nutze diese Seite, um die API, die Web-App und ihre Abhängigkeiten auf deinem Rechner auszuführen.

## Voraussetzungen

- .NET 10 SDK
- Docker
- Bun, für die Web-App
- Optional: das Tool `dotnet-ef` für [Migrationen](../migrations.md)
  (`dotnet tool install --global dotnet-ef`)

## 1. Abhängigkeiten starten

```sh
docker compose -f compose.dev.yml up -d
```

| Service | Image | Host-Port | Hinweise |
|---|---|---|---|
| Postgres | `postgres:18.1` | `2406` | Datenbank `schuly-dev` |
| SeaweedFS | `chrislusf/seaweedfs:latest` | `8333`, `9333`, `8888` | S3-API, Master-UI, Filer |
| SchulwareAPI | `ghcr.io/pianonic/schulwareapi:latest` | `8000` | Schulnetz-Brücke für das Schulware-Plugin |

Anmelde-Mails, zum Beispiel für Verifizierung und Zurücksetzen des Passworts, gehen an einen SMTP-Catcher auf
`localhost:1025`, wie in `appsettings.Development.json` festgelegt. `compose.dev.yml` enthält keinen. Starte ihn also selbst:

```sh
docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Das Postfach liegt unter [http://localhost:8025](http://localhost:8025). Links in den Mails zeigen auf
`http://localhost:4200`.

## 2. API darauf ausrichten

Das Repo liefert keinen Connection-String mit. Ein frischer Klon stoppt beim Start deshalb mit
`The ConnectionString property has not been initialized.` Speichere die lokalen Werte in
[User Secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets), damit sie nicht in Git landen:

```sh
cd src/Schuly.API
dotnet user-secrets set "ConnectionStrings:SchulyDatabase" "Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=d4vpas8w0rd13!!!"
dotnet user-secrets set "LocalLogin:SigningKey" "$(openssl rand -base64 32)"
dotnet user-secrets set "TwoFactor:EncryptionKey" "$(openssl rand -base64 32)"
```

Der Connection-String wiederholt `compose.dev.yml`. Die zwei Schlüssel signieren Access-Tokens und verschlüsseln
Zwei-Faktor-Secrets. Behalte sie, sobald du sie gesetzt hast: Ein neuer Signaturschlüssel meldet alle ab, und ein neuer
Verschlüsselungsschlüssel macht Zwei-Faktor kaputt. Du kannst stattdessen Umgebungsvariablen nutzen. Siehe
[Konfiguration](configuration.md).

Um Dokumente und Avatare zu nutzen, setze auch die `S3:`-Schlüssel und `Avatar:SigningKey`. Die Dev-S3-Zugangsdaten stehen in
`scripts/seaweedfs/s3-config.json`.

In Development startet der Server ohne `Vault:MasterKey` und `Documents:EncryptionKey`. Er nutzt dann temporäre Schlüssel.
Gespeicherte Plugin-Zugangsdaten und verschlüsselte Dokumente überstehen also keinen Neustart.

## 3. API ausführen

```sh
cd src/Schuly.API
dotnet run --urls=http://localhost:5033
```

Beim Start wendet die API EF-Core-Migrationen an und befüllt den Schulsystem-Katalog. Die Datenbank ist also beim ersten
Lauf bereit. In Development schaltet die API auch das Request-Logging und das API-Referenz-UI ein.

## 4. Web-App ausführen

```sh
cd src/Schuly.Frontend
bun install
bun start        # ng serve on http://localhost:4200
```

`proxy.conf.json` leitet `/api` und `/auth` an `http://127.0.0.1:5033` weiter.

## Token erhalten

Registriere dich über die Web-App oder rufe die Anmelde-Endpunkte auf:

```sh
curl -X POST http://localhost:5033/auth/register -H "Content-Type: application/json" \
  -d '{"userName":"dev","email":"dev@example.com","password":"<password>"}'
curl -X POST http://localhost:5033/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"dev","password":"<password>"}'
```

`appsettings.json` setzt `LocalLogin:RequireVerifiedEmailForSignIn` auf `true`. Verifiziere die Adresse deshalb über die
Mail im Postfach, bevor du dich anmeldest.

Die Login-Antwort enthält das Access-Token. Sende es als `Authorization: Bearer` an `/api/*`, oder füge es im Scalar-UI ein.
Siehe [Konfiguration](configuration.md#sign-in).

## API-Referenz

- **Scalar-UI:** [http://localhost:5033/scalar](http://localhost:5033/scalar)
- **OpenAPI-3.0-Dokument:**
  [http://localhost:5033/openapi/v1.json](http://localhost:5033/openapi/v1.json). Das eingebaute
  `Microsoft.AspNetCore.OpenApi` erzeugt es, und der Dart-Client wird daraus generiert.

## Tests ausführen

```sh
dotnet test
```

Die Suite ist [TUnit](https://tunit.dev/), das auf Microsoft.Testing.Platform läuft. Das .NET 10 SDK führt diese Projekte
nicht mehr über VSTest aus. `global.json` schaltet das Repo deshalb in den MTP-Modus. Ohne das schlägt `dotnet test` fehl mit
`Testing with VSTest target is no longer supported`.

So führst du das Projekt direkt aus:

```sh
dotnet run --project src/Schuly.Tests
```

So testest du die Web-App:

```sh
cd src/Schuly.Frontend
bun run test --watch=false
bun run e2e                 # playwright test
```
