# Entwicklungs-Setup

Die API und ihre Abhängigkeiten lokal ausführen.

## Voraussetzungen

- **.NET 10 SDK**
- **Docker** (für Postgres; die Dev-Compose-Datei startet zusätzlich SeaweedFS und
  eine lokale SchulwareAPI-Instanz)
- Optional: das globale `dotnet-ef`-Tool für [Migrationen](../migrations.md)
  (`dotnet tool install --global dotnet-ef`)

## 1. Die Abhängigkeiten hochfahren

```sh
docker compose -f compose.dev.yml up -d
```

`compose.dev.yml` startet:

- **Postgres** (`postgres:18.1`) auf Host-Port `2406`, Datenbank `schuly-dev`.
- **SeaweedFS** S3 (Dokumenten-Storage) auf `8333`.
- **SchulwareAPI** (Schulnetz-Bridge für das Schulware-Plugin) auf `8000`.

Anmelde-Mails (Verifizierung, Passwort-Reset) gehen an einen lokalen SMTP-Catcher
auf `localhost:1025`, wie in `appsettings.Development.json` gesetzt. Er ist nicht
Teil von `compose.dev.yml`; starte einen zum Beispiel mit:

```sh
docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
```

Der Posteingang liegt unter <http://localhost:8025>. Links in den Mails zeigen auf
`http://localhost:4200`.

## 2. Die API darauf ausrichten

Im Repo ist kein Connection-String enthalten, daher bricht ein frischer Clone
beim Start mit `The ConnectionString property has not been initialized.` ab. Die
lokalen Werte in [User Secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets)
ablegen, die dadurch aus Git herausgehalten werden:

```sh
cd src/Schuly.API
dotnet user-secrets set "ConnectionStrings:SchulyDatabase" "Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=d4vpas8w0rd13!!!"
dotnet user-secrets set "LocalLogin:SigningKey" "$(openssl rand -base64 32)"
dotnet user-secrets set "TwoFactor:EncryptionKey" "$(openssl rand -base64 32)"
```

Der Connection-String ist nur die Wiederholung von `compose.dev.yml`. Die beiden
Schlüssel signieren Access-Tokens und verschlüsseln Zwei-Faktor-Secrets. Behalte sie,
sobald sie gesetzt sind: Ein neuer Signierschlüssel meldet alle ab, und ein neuer
Verschlüsselungsschlüssel macht Zwei-Faktor unbrauchbar. Umgebungsvariablen sind
eine gleichwertige Alternative - siehe [Konfiguration](configuration.md).

## 3. Die API ausführen

```sh
cd src/Schuly.API
dotnet run --urls=http://localhost:5033
```

Beim Start wendet die API die EF-Core-Migrationen an (`ApplyMigrations()` in
`Program.cs`) und spielt den School-Systems-Katalog ein, sodass die Datenbank
beim ersten Lauf bereit ist.

In Development sind Request-Logging und die API-Referenz-UI aktiviert.

## Ein Token holen

Registriere dich über die Web-App, oder rufe die Anmelde-Endpunkte direkt auf:

```sh
curl -X POST http://localhost:5033/auth/register -H "Content-Type: application/json" \
  -d '{"userName":"dev","email":"dev@example.com","password":"<password>"}'
curl -X POST http://localhost:5033/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"dev","password":"<password>"}'
```

Die Login-Antwort enthält das Access-Token. Sende es als `Authorization: Bearer` an
`/api/*`, oder füge es in die Scalar-UI ein. Siehe
[Konfiguration](configuration.md#anmeldung).

## API-Referenz

- **Scalar-UI**: <http://localhost:5033/scalar>
- **OpenAPI-3.0-Dokument**: <http://localhost:5033/openapi/v1.json> (der
  Dart-Client wird aus diesem Dokument generiert)

Das OpenAPI-Dokument wird vom eingebauten `Microsoft.AspNetCore.OpenApi`
erzeugt.

## Tests

```sh
dotnet test
```

Die Testsuite ist [TUnit](https://tunit.dev/), das auf Microsoft.Testing.Platform
läuft. Das .NET 10 SDK führt diese Projekte nicht mehr über den alten
VSTest-Pfad aus, daher schaltet `global.json` das Repo in den MTP-Modus - ohne
das schlägt `dotnet test` mit *"Testing with VSTest target is no longer
supported"* fehl. Um das Projekt stattdessen direkt auszuführen:

```sh
dotnet run --project src/Schuly.Tests
```
