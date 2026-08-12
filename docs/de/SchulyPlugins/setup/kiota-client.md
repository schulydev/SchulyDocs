# Kiota-Client

Das Schulware-Plugin spricht mit [SchulwareAPI](https://github.com/schulydev/SchulwareAPI) über
einen [Kiota](https://learn.microsoft.com/openapi/kiota/)-generierten Client unter
`src/Schuly.Plugin.Schulware/Client/`. Der generierte Code wird committet; die
**OpenAPI-JSON nicht** - regeneriere immer direkt von der Live-URL.

## Erste Generierung

```sh
cd src/Schuly.Plugin.Schulware
kiota generate \
  --openapi https://schlwr.pianonic.ch/openapi.json \
  --language CSharp \
  --output Client \
  --namespace-name Schuly.Plugin.Schulware.Client \
  --class-name SchulwareApiClient
```

Das erzeugt `Client/SchulwareApiClient.cs`, die Request-Builder unter `Client/Api/`, die DTOs
unter `Client/Models/` und eine `Client/kiota-lock.json`, die die Quell-URL, die
Generator-Version und den verwendeten Serializer-/Deserializer-Satz festhält.

## Aktualisieren nach einer API-Änderung

Sobald die Lockfile existiert, führe von innerhalb von `Client/` erneut aus:

```sh
cd src/Schuly.Plugin.Schulware/Client
kiota update
```

`kiota update` liest `kiota-lock.json` und generiert gegen denselben `descriptionLocation`
(die Live-OpenAPI-URL) mit den festgehaltenen Optionen neu - gleichbedeutend mit einem erneuten
Aufruf von `kiota generate`.

## Regeln

- **Committe niemals lokal die OpenAPI-JSON.** Die Generierung liest sie immer von der Live-URL,
  damit der Client dem deployten Stand der API folgt.
- Die Kiota-Laufzeitpakete (`Microsoft.Kiota.*`) sind `PackageReference`s in
  `Schuly.Plugin.Schulware.csproj`; halte ihre Versionen kompatibel mit dem Generator.
- Eine Regenerierung ist eine Code-Änderung wie jede andere - folge dem
  [Contributing](../contributing.md)-Workflow.
