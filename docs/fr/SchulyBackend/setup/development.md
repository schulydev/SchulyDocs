# Mise en place du développement

Fais tourner l'API et ses dépendances en local.

## Prérequis

- **.NET 10 SDK**
- **Docker** (pour Postgres ; le fichier compose de dev démarre aussi SeaweedFS et une
  instance locale de SchulwareAPI)
- Optionnel : l'outil global `dotnet-ef` pour les [migrations](../migrations.md)
  (`dotnet tool install --global dotnet-ef`)

## 1. Démarrer les dépendances

```sh
docker compose -f compose.dev.yml up -d
```

`compose.dev.yml` démarre :

- **Postgres** (`postgres:18.1`) sur le port hôte `2406`, base de données `schuly-dev`.
- **SeaweedFS** S3 (stockage de documents) sur `8333`.
- **SchulwareAPI** (pont Schulnetz utilisé par le plugin Schulware) sur `8000`.

## 2. Pointer l'API vers elles

Aucune chaîne de connexion n'est livrée dans le dépôt, donc un clone tout frais
s'arrête au démarrage avec `The ConnectionString property has not been initialized.`
Stocke les valeurs locales dans les
[secrets utilisateur](https://learn.microsoft.com/aspnet/core/security/app-secrets),
ce qui les garde hors de git :

```sh
cd src/Schuly.API
dotnet user-secrets set "ConnectionStrings:SchulyDatabase" "Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=d4vpas8w0rd13!!!"
dotnet user-secrets set "Oidc:Authority" "http://localhost:8080/realms/schuly"
```

La chaîne de connexion n'est jamais que la reprise de `compose.dev.yml`.
`Oidc:Authority` n'est pas utilisée pour la connexion tant que `DevAuth` est activé,
mais le document OpenAPI annonce les endpoints OAuth de l'autorité, donc
**`/openapi/v1.json` échoue avec une erreur 500 tant qu'elle n'est pas définie** - et
l'interface Scalar s'affiche vide car elle charge ce document. N'importe quelle valeur
pointant vers ton Keycloak fonctionne. Les variables d'environnement sont une
alternative équivalente - voir [Configuration](configuration.md).

## 3. Lancer l'API

```sh
cd src/Schuly.API
dotnet run --urls=http://localhost:5033
```

Au démarrage, l'API applique les migrations EF Core (`ApplyMigrations()` dans
`Program.cs`) et alimente le catalogue des systèmes scolaires, donc la base de données
est prête dès le premier lancement.

En Development, la journalisation des requêtes et l'interface de référence de l'API
sont activées, et un chemin OIDC factice optionnel (`DevAuth`) te permet d'émettre des
jetons locaux via `/api/dev/token` plutôt que de contacter un vrai fournisseur
d'identité. Voir [Configuration](configuration.md).

## Référence de l'API

- **Interface Scalar** : <http://localhost:5033/scalar>
- **Document OpenAPI 3.0** : <http://localhost:5033/openapi/v1.json> (le client Dart
  est généré à partir de ce document)

Le document OpenAPI est produit par le module intégré `Microsoft.AspNetCore.OpenApi`.

## Tests

```sh
dotnet test
```

La suite utilise [TUnit](https://tunit.dev/), qui s'exécute sur
Microsoft.Testing.Platform. Le SDK .NET 10 ne fait plus passer ces projets par l'ancien
chemin VSTest, donc `global.json` fait basculer le dépôt en mode MTP - sans cela,
`dotnet test` échoue avec *"Testing with VSTest target is no longer supported"*. Pour
exécuter le projet directement à la place :

```sh
dotnet run --project src/Schuly.Tests
```
