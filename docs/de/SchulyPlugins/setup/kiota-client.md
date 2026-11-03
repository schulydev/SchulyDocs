# Kiota-Client

Nutze diese Seite, um den Client neu zu generieren, mit dem das Schulware-Plugin
[SchulwareAPI](https://github.com/schulydev/SchulwareAPI) aufruft. Er ist ein von
[Kiota](https://learn.microsoft.com/openapi/kiota/) generierter Client in `src/Schuly.Plugin.Schulware/Client/`.

Der generierte Code ist committet. Das OpenAPI-JSON ist es nicht. Du generierst also immer von der Live-URL neu.

## Nach API-Änderungen aktualisieren

Führe das in `Client/` aus:

```sh
cd src/Schuly.Plugin.Schulware/Client
kiota update --output .
```

`kiota update` liest `kiota-lock.json` und generiert mit den gespeicherten Optionen neu gegen dieselbe
`descriptionLocation`, die Live-OpenAPI-URL. Das Ergebnis ist dasselbe wie bei einem erneuten `kiota generate`. Ohne
`--output .` sucht es in `./output` und schlägt fehl.

## Von Grund auf generieren

```sh
cd src/Schuly.Plugin.Schulware
kiota generate \
  --openapi https://schlwr.pianonic.ch/openapi.json \
  --language CSharp \
  --output Client \
  --namespace-name Schuly.Plugin.Schulware.Client \
  --class-name SchulwareApiClient
```

Das erzeugt `Client/SchulwareApiClient.cs`, die Request-Builder in `Client/Api/`, die DTOs in `Client/Models/` und
`Client/kiota-lock.json`. Die Lock-Datei hält die Quell-URL, die Generator-Version und das Set aus Serializer und
Deserializer fest.

## Regeln

- **Committe das OpenAPI-JSON nie.** Die Generierung liest es immer von der Live-URL, damit der Client der
  bereitgestellten API folgt.
- Halte die Kiota-Runtime-Packages (`Microsoft.Kiota.*`) mit dem Generator kompatibel. Sie sind `PackageReference`s in
  `Schuly.Plugin.Schulware.csproj`.
- Behandle das Neugenerieren als Code-Änderung. Folge dem [gemeinsamen Workflow](/de/contribute/).
