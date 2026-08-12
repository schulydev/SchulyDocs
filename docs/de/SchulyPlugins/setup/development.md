# Entwicklungsumgebung

## Voraussetzungen

- **.NET 10 SDK** - jede Plugin-csproj zielt auf `net10.0`
  (`<TargetFramework>net10.0</TargetFramework>`).
- **EF-Core-CLI-Tools** (`dotnet-ef`) - für Plugins mit einem `DbContext` (Schulware, OdaOrg).
  Installieren/aktualisieren mit `dotnet tool install --global dotnet-ef` (oder
  `dotnet tool update`). Siehe [migrations.md](../migrations.md).
- **[Kiota](https://learn.microsoft.com/openapi/kiota/install)** - nur nötig, um den
  Schulware-API-Client neu zu generieren. Siehe [setup/kiota-client.md](kiota-client.md).
- Ein laufendes **[SchulyBackend](https://github.com/schulydev/SchulyBackend)** mit PostgreSQL,
  um ein Plugin end-to-end zu laden und zu testen.

## Die Abhängigkeit zu den Abstractions

`Schuly.Plugin.Abstractions` ist eine NuGet-**`PackageReference`**, keine Projektreferenz:

```xml
<PackageReference Include="Schuly.Plugin.Abstractions" Version="0.2.*" />
```

Sie liefert `ISchulyPlugin`, `IPluginBackgroundTask`, `IPluginUserContext`, `IPluginLogin` und
`PluginServiceContext`. Vom Backend bereitgestellte Typen wie `IPluginVault`
(`Schuly.Infrastructure.Vault`) werden zur Laufzeit aus dem DI-Container des Hosts aufgelöst - der
Host registriert das isolierte Vault jedes Plugins unter dessen `Name`.

## Wie ein Plugin aufgebaut ist

Ein Plugin ist eine Class Library, die eine `ISchulyPlugin`-Implementierung bereitstellt (die
Composition Root, schlank wie eine ASP.NET-`Program.cs`). Die umfangreicheren Plugins halten
HTTP-Routen in `Controllers/` (als MVC-ApplicationPart erkannt), statt sie in
`ConfigureEndpoints` zu mappen, und teilen die Sync-Logik auf kleine, gescopte Services auf, die
von einem einzigen `IPluginBackgroundTask` gesteuert werden.

Den vollständigen Lebenszyklus findest du unter [adding-a-plugin.md](../adding-a-plugin.md).

## Ein Plugin bauen

```sh
# Ein einzelnes Plugin restoren + bauen
dotnet build src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release

# Das ladbare Ergebnis erzeugen (DLL + Nicht-Host-Abhängigkeiten) - derselbe Befehl wie in der CI
dotnet publish src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release -o ./out
```

Jedes Plugin hat zudem eine `.slnx`-Solution-Datei, um es eigenständig in einer IDE zu öffnen.

## Ein Plugin gegen ein laufendes Backend betreiben

Der Plugin-Host des Backends lädt Plugin-DLLs aus seinem `plugins/`-Verzeichnis
(`/app/plugins/` im Container) und liest die YAML-Konfiguration jedes Plugins aus seinem
Plugins-Config-Verzeichnis.

1. SchulyBackend + Postgres hochfahren (siehe README des Backends).
2. Führe `dotnet publish` für das Plugin aus (siehe oben) und kopiere die Plugin-DLL samt ihren
   Drittanbieter-Abhängigkeits-DLLs in den `plugins/`-Ordner des Backends. Vom Host geteilte
   Assemblies (ASP.NET Core, EF Core, Npgsql, die Abstractions, die Schuly-Host-Assemblies) stellt
   das Backend bereits bereit - nur echte Drittanbieter-Abhängigkeiten (z. B. Kiota, AngleSharp)
   müssen zusammen mit dem Plugin ausgeliefert werden.
3. Lege die Laufzeitkonfiguration des Plugins als `Schuly.Plugin.<Name>.yml` in das
   Plugins-Config-Verzeichnis des Backends. Für Schulware **muss** diese mindestens
   `SchulwareApi.BaseUrl` enthalten - sonst wirft `ConfigureServices` einen Fehler und verweigert
   das Laden (siehe `src/Schuly.Plugin.Schulware/config.yml` für das Schema).
4. Backend neu starten. Beim Start ruft der Host `ConfigureServices` → `ConfigureEndpoints` →
   `MigrateAsync` auf (was `db.Database.MigrateAsync()` ausführt, um die dedizierte
   Postgres-Datenbank des Plugins anzulegen bzw. zu aktualisieren) und plant anschliessend jeden
   `IPluginBackgroundTask` gemäss seinem `Interval` ein.

Für die reale Distribution (vorgebaute DLLs per `curl` herunterladen) siehe
[setup/distribution.md](distribution.md).
