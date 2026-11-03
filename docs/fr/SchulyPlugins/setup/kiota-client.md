# Client Kiota

Utilise cette page pour régénérer le client que le plugin Schulware utilise pour appeler
[SchulwareAPI](https://github.com/PianoNic/SchulwareAPI). C'est un client généré par
[Kiota](https://learn.microsoft.com/openapi/kiota/) dans `src/Schuly.Plugin.Schulware/Client/`.

Le code généré est commité. Le JSON OpenAPI ne l'est pas, donc tu régénères toujours depuis l'URL en direct.

## Mettre à jour après un changement de l'API

Exécute ceci depuis `Client/` :

```sh
cd src/Schuly.Plugin.Schulware/Client
kiota update --output .
```

`kiota update` lit `kiota-lock.json` et régénère à partir du même `descriptionLocation`, l'URL OpenAPI en
direct, avec les options enregistrées. Il donne le même résultat qu'une nouvelle exécution de
`kiota generate`. Sans `--output .`, il cherche dans `./output` et échoue.

## Générer à partir de zéro

```sh
cd src/Schuly.Plugin.Schulware
kiota generate \
  --openapi https://schlwr.pianonic.ch/openapi.json \
  --language CSharp \
  --output Client \
  --namespace-name Schuly.Plugin.Schulware.Client \
  --class-name SchulwareApiClient
```

Cette commande produit `Client/SchulwareApiClient.cs`, les constructeurs de requêtes dans `Client/Api/`, les
DTO dans `Client/Models/` et `Client/kiota-lock.json`. Le fichier de verrouillage enregistre l'URL source, la
version du générateur et l'ensemble de sérialiseurs et de désérialiseurs.

## Règles

- **Ne commite jamais le JSON OpenAPI.** La génération le lit toujours depuis l'URL en direct, donc le client
  suit l'API déployée.
- Garde les packages d'exécution Kiota (`Microsoft.Kiota.*`) compatibles avec le générateur. Ce sont des
  `PackageReference` dans `Schuly.Plugin.Schulware.csproj`.
- Traite la régénération comme un changement de code. Suis le [processus partagé](/fr/contribute/).
