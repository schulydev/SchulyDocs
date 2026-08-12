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

## 2. Die API darauf ausrichten

Im Repo ist kein Connection-String enthalten, daher bricht ein frischer Clone
beim Start mit `The ConnectionString property has not been initialized.` ab. Die
lokalen Werte in [User Secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets)
ablegen, die dadurch aus Git herausgehalten werden:

```sh
cd src/Schuly.API
dotnet user-secrets set "ConnectionStrings:SchulyDatabase" "Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=d4vpas8w0rd13!!!"
dotnet user-secrets set "Oidc:Authority" "http://localhost:8080/realms/schuly"
```

Der Connection-String ist nur die Wiederholung von `compose.dev.yml`.
`Oidc:Authority` wird für die Anmeldung nicht benötigt, solange `DevAuth`
aktiviert ist, aber das OpenAPI-Dokument kündigt die OAuth-Endpunkte der
Authority an - deshalb **schlägt `/openapi/v1.json` mit 500 fehl, bis der Wert
gesetzt ist**, und die Scalar-UI bleibt leer, weil sie dieses Dokument lädt.
Jeder Wert, der auf dein Keycloak zeigt, funktioniert. Umgebungsvariablen sind
eine gleichwertige Alternative - siehe [Konfiguration](configuration.md).

## 3. Die API ausführen

```sh
cd src/Schuly.API
dotnet run --urls=http://localhost:5033
```

Beim Start wendet die API die EF-Core-Migrationen an (`ApplyMigrations()` in
`Program.cs`) und spielt den School-Systems-Katalog ein, sodass die Datenbank
beim ersten Lauf bereit ist.

In Development sind Request-Logging und die API-Referenz-UI aktiviert, und ein
optionaler Fake-OIDC-Pfad (`DevAuth`) erlaubt es, lokale Tokens über
`/api/dev/token` auszustellen, statt einen echten Identity Provider zu
kontaktieren. Siehe [Konfiguration](configuration.md).

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
