# Client Kiota

Le plugin Schulware communique avec [SchulwareAPI](https://github.com/schulydev/SchulwareAPI) via
un client généré par [Kiota](https://learn.microsoft.com/openapi/kiota/) sous
`src/Schuly.Plugin.Schulware/Client/`. Le code généré est committé ; le **JSON OpenAPI ne l'est
pas** - régénère toujours directement depuis l'URL en production.

## Première génération

```sh
cd src/Schuly.Plugin.Schulware
kiota generate \
  --openapi https://schlwr.pianonic.ch/openapi.json \
  --language CSharp \
  --output Client \
  --namespace-name Schuly.Plugin.Schulware.Client \
  --class-name SchulwareApiClient
```

Cela produit `Client/SchulwareApiClient.cs`, les request builders sous `Client/Api/`, les DTO
sous `Client/Models/`, et un `Client/kiota-lock.json` qui enregistre l'URL source, la version du
générateur, et l'ensemble de sérialiseurs/désérialiseurs utilisé.

## Mettre à jour après un changement d'API

Une fois le fichier de verrouillage (lockfile) créé, relance depuis l'intérieur de `Client/` :

```sh
cd src/Schuly.Plugin.Schulware/Client
kiota update
```

`kiota update` lit `kiota-lock.json` et régénère à partir du même `descriptionLocation` (l'URL
OpenAPI en production) avec les options enregistrées - équivalent à relancer `kiota generate`.

## Règles

- **Ne committe jamais le JSON OpenAPI** en local. La génération le lit toujours depuis l'URL en
  production, afin que le client reflète la version déployée de l'API.
- Les paquets d'exécution de Kiota (`Microsoft.Kiota.*`) sont des `PackageReference` dans
  `Schuly.Plugin.Schulware.csproj` ; garde leurs versions compatibles avec le générateur.
- Une régénération est un changement de code comme un autre - suis le processus de
  [contribution](../contributing.md).
