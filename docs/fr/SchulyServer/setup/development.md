# Configuration de développement

Utilise cette page pour exécuter l'API, l'application web et leurs dépendances sur ta machine.

## Prérequis

- SDK .NET 10
- Docker
- Bun, pour l'application web
- Optionnel : l'outil `dotnet-ef` pour les [migrations](../migrations.md)
  (`dotnet tool install --global dotnet-ef`)

## 1. Démarrer les dépendances

```sh
docker compose -f compose.dev.yml up -d
```

| Service | Image | Port de l'hôte | Remarques |
|---|---|---|---|
| Postgres | `postgres:18.1` | `2406` | Base de données `schuly-dev` |
| SeaweedFS | `chrislusf/seaweedfs:latest` | `8333`, `9333`, `8888` | API S3, interface du master, filer |
| SchulwareAPI | `ghcr.io/pianonic/schulwareapi:latest` | `8000` | Pont vers Schulnetz pour le plugin Schulware |

Les mails de connexion, comme la vérification et la réinitialisation du mot de passe, vont à un collecteur SMTP sur
`localhost:1025`, comme défini dans `appsettings.Development.json`. `compose.dev.yml` n'en contient pas, donc
démarre-le toi-même :

```sh
docker run -p 1025:1025 -p 8025:8025 axllent/mailpit
```

La boîte de réception est à [http://localhost:8025](http://localhost:8025). Les liens dans les mails pointent vers
`http://localhost:4200`.

## 2. Y connecter l'API

Le dépôt ne fournit pas de chaîne de connexion, donc un nouveau clone s'arrête au démarrage avec
`The ConnectionString property has not been initialized.` Stocke les valeurs locales dans les
[secrets utilisateur](https://learn.microsoft.com/aspnet/core/security/app-secrets), ce qui les garde hors de git :

```sh
cd src/Schuly.API
dotnet user-secrets set "ConnectionStrings:SchulyDatabase" "Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=d4vpas8w0rd13!!!"
dotnet user-secrets set "LocalLogin:SigningKey" "$(openssl rand -base64 32)"
dotnet user-secrets set "TwoFactor:EncryptionKey" "$(openssl rand -base64 32)"
```

La chaîne de connexion reprend `compose.dev.yml`. Les deux clés signent les jetons d'accès et chiffrent les secrets
de double authentification. Garde-les une fois définies : une nouvelle clé de signature déconnecte tout le monde, et
une nouvelle clé de chiffrement casse la double authentification. Tu peux utiliser des variables d'environnement à
la place. Voir [Configuration](configuration.md).

Pour utiliser les documents et les avatars, définis aussi les clés `S3:` et `Avatar:SigningKey`. Les identifiants S3
de développement sont dans `scripts/seaweedfs/s3-config.json`.

En Development, le serveur démarre sans `Vault:MasterKey` ni `Documents:EncryptionKey`. Il utilise alors des clés
temporaires, donc les identifiants de plugins stockés et les documents chiffrés ne survivent pas à un redémarrage.

## 3. Exécuter l'API

```sh
cd src/Schuly.API
dotnet run --urls=http://localhost:5033
```

Au démarrage, l'API applique les migrations EF Core et initialise le catalogue des systèmes scolaires, donc la base
de données est prête dès la première exécution. En Development, elle active aussi la journalisation des requêtes et
l'interface de référence de l'API.

## 4. Exécuter l'application web

```sh
cd src/Schuly.Frontend
bun install
bun start        # ng serve on http://localhost:4200
```

`proxy.conf.json` transmet `/api` et `/auth` à `http://127.0.0.1:5033`.

## Obtenir un jeton

Inscris-toi par l'application web, ou appelle les points d'entrée de connexion :

```sh
curl -X POST http://localhost:5033/auth/register -H "Content-Type: application/json" \
  -d '{"userName":"dev","email":"dev@example.com","password":"<password>"}'
curl -X POST http://localhost:5033/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"dev","password":"<password>"}'
```

`appsettings.json` définit `LocalLogin:RequireVerifiedEmailForSignIn` à `true`, donc vérifie l'adresse par le mail
dans la boîte de réception avant de te connecter.

La réponse de connexion contient le jeton d'accès. Envoie-le dans `Authorization: Bearer` à `/api/*`, ou colle-le
dans l'interface Scalar. Voir [Configuration](configuration.md#sign-in).

## Référence de l'API

- **Interface Scalar :** [http://localhost:5033/scalar](http://localhost:5033/scalar)
- **Document OpenAPI 3.0 :**
  [http://localhost:5033/openapi/v1.json](http://localhost:5033/openapi/v1.json). Le
  `Microsoft.AspNetCore.OpenApi` intégré le produit, et le client Dart est généré à partir de lui.

## Exécuter les tests

```sh
dotnet test
```

La suite utilise [TUnit](https://tunit.dev/), qui s'exécute sur Microsoft.Testing.Platform. Le SDK .NET 10 n'exécute
plus ces projets par VSTest, donc `global.json` fait passer le dépôt en mode MTP. Sans lui, `dotnet test` échoue avec
`Testing with VSTest target is no longer supported`.

Pour exécuter directement le projet :

```sh
dotnet run --project src/Schuly.Tests
```

Pour tester l'application web :

```sh
cd src/Schuly.Frontend
bun run test --watch=false
bun run e2e                 # playwright test
```
