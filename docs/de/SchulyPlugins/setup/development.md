# Entwicklungsumgebung

Nutze diese Seite, um die Tools zu installieren, ein Plugin zu bauen und es auf einem lokalen Server auszuführen.

## Voraussetzungen

- **.NET 10 SDK.** Jede Plugin-csproj zielt auf `net10.0`.
- **EF Core CLI Tools** (`dotnet-ef`), für Plugins mit einem `DbContext` (Schulware, OdaOrg). Siehe
  [Migrationen](../migrations.md).

  ```sh
  dotnet tool install --global dotnet-ef
  dotnet tool update --global dotnet-ef
  ```

- **[Kiota](https://learn.microsoft.com/openapi/kiota/install)**, um den Schulware-API-Client neu zu generieren. Siehe
  [Kiota-Client](kiota-client.md).
- Ein laufender **[SchulyServer](/de/SchulyServer/setup/development)** mit PostgreSQL, um ein Plugin von Anfang bis Ende
  zu laden und zu testen.

## Die Abstractions-Abhängigkeit

`Schuly.Plugin.Abstractions` ist eine NuGet-`PackageReference`, keine Projektreferenz:

```xml
<PackageReference Include="Schuly.Plugin.Abstractions" Version="0.11.*" />
```

Es liefert den ganzen Vertrag, darunter `ISchulyPlugin`, `IPluginBackgroundTask`, `IPluginUserContext`, `IPluginLogin`,
`ISchoolData` und seine Records, `IPluginVault`, `IPluginFileStore`, `ILinkedAccounts`, `ILinkProvider` und
`PluginServiceContext`. Siehe die [Vertragsreferenz](/de/SchulyPluginAbstractions/contract).

Plugins referenzieren nichts aus dem Backend. Der Host registriert die Service-Implementierungen zur Laufzeit im
Container jedes Plugins.

Das Backend weigert sich, ein Plugin zu laden, das gegen eine inkompatible Vertragsversion gebaut ist. Vor 1.0 bedeutet
das eine andere MAJOR.MINOR. Der Publish-Workflow schreibt die Version als `contract` in `index.json`. So aktualisiert
das Backend nie auf einen Build, den es nicht laden kann. Siehe [Versionierung](/de/SchulyPluginAbstractions/versioning).

## Wie ein Plugin aufgebaut ist

Ein Plugin ist eine Klassenbibliothek mit einer `ISchulyPlugin`-Implementierung, dem Composition Root. Die grösseren
Plugins halten HTTP-Routen in `Controllers/`, die als MVC-ApplicationPart gefunden werden, statt sie in
`ConfigureEndpoints` zu registrieren. Sie teilen die Sync-Logik auf kleine Scoped Services auf, die ein
`IPluginBackgroundTask` steuert.

Den vollständigen Lebenszyklus findest du unter [Plugin hinzufügen](../adding-a-plugin.md).

## Plugin bauen

```sh
# Restore and build one plugin
dotnet build src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release

# Produce the loadable output (the same command CI uses)
dotnet publish src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release -o ./out
```

Die Plugins Example und Schulware haben auch eine `.slnx`-Datei, die das Plugin eigenständig in einer IDE öffnet.

## Plugin auf einem lokalen Server starten

Der Server lädt ein Plugin nur, wenn es in `plugins.yml` aufgelistet ist und im Plugins-Ordner ein Manifest hat. Er
entfernt installierte Plugins, die nicht aufgelistet sind.

Diese Pfade sind relativ zum App-Ordner des Servers, `<app>`. Mit `dotnet run` ist das der Build-Ausgabeordner von
`Schuly.API`. Im Container ist es `/app`.

| Datei | Standard | Einstellung |
|---|---|---|
| Plugin-Liste | `<app>/plugins.yml` | `Plugins:File` |
| Plugin-DLLs und Manifeste | `<app>/plugins/` | `Plugins:Directory` |
| Plugin-Konfiguration | `<app>/plugins-config/` | `Plugins:ConfigDirectory` |

1. Starte SchulyServer und Postgres. Siehe die [Entwicklungsumgebung](/de/SchulyServer/setup/development) des Servers.
2. Führe `dotnet publish` wie oben gezeigt aus.
3. Kopiere `out/Schuly.Plugin.<Name>.dll` und die DLLs seiner Drittanbieter-Abhängigkeiten, zum Beispiel Kiota oder
   AngleSharp, in den Plugins-Ordner. Lass weg, was der Server bereitstellt: `Microsoft.AspNetCore.*`,
   `Microsoft.Extensions.*`, `Microsoft.EntityFrameworkCore.*`, `Npgsql.*`, `Mediator.*` und
   `Schuly.Plugin.Abstractions.dll`.
4. Erstelle im Plugins-Ordner das Manifest `Schuly.Plugin.<Name>.plugin.json`. Liste jede kopierte Datei in `files` auf:

   ```json
   {
     "name": "Schuly.Plugin.<Name>",
     "version": "1.0.0",
     "dll": "Schuly.Plugin.<Name>.dll",
     "files": ["Schuly.Plugin.<Name>.dll"]
   }
   ```

5. Füge das Plugin mit derselben Version wie im Manifest zu `plugins.yml` hinzu. Wenn sich die Version unterscheidet und
   das Plugin auch in der Registry ist, ersetzt der Server deinen Build durch den aus der Registry.

   ```yaml
   plugins:
     - name: Schuly.Plugin.<Name>
       version: 1.0.0
   ```

6. Wenn das Plugin Konfiguration braucht, speichere sie als `Schuly.Plugin.<Name>.yml` (oder `.yaml`) im
   Plugin-Konfigurationsordner.
   - Schulware verlangt `SchulwareApi.BaseUrl`. Das Schema findest du in
     [`config.yml`](https://github.com/schulydev/SchulyPlugins/blob/main/src/Schuly.Plugin.Schulware/config.yml).
   - Microsoft verlangt `MicrosoftApi.BaseUrl`.

   Ohne den verlangten Wert wirft `ConfigureServices` des Plugins eine Exception, und das Plugin wird nicht geladen.
7. Starte den Server neu.

Beim Start ruft der Host `ConfigureServices` auf, dann `MigrateAsync`, das die Postgres-Datenbank des Plugins erstellt
oder aktualisiert, dann `ConfigureEndpoints`. Danach plant er jeden `IPluginBackgroundTask` nach seinem `Schedule` ein.

Wie Plugins veröffentlicht werden, steht unter [Distribution](distribution.md).
