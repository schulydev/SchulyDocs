# Configuration

La configuration provient de `appsettings.json`, de surcharges propres à
l'environnement (`appsettings.Development.json`), des secrets utilisateur (user
secrets), et des variables d'environnement, selon l'ordre de priorité standard d'ASP.NET
Core (les variables d'environnement l'emportent sur les secrets utilisateur, qui
l'emportent sur `appsettings.{Environment}.json`, qui l'emporte sur `appsettings.json`).

Les secrets ne sont volontairement **pas** commités : les `appsettings*.json` suivis
par git ne contiennent que les niveaux de journalisation et `DevAuth`. En local, ce
manque est comblé avec `dotnet user-secrets set` (voir
[Mise en place du développement](development.md)) ; dans un conteneur, il est comblé
avec des variables d'environnement, en utilisant `__` comme séparateur de section
(`ConnectionStrings__SchulyDatabase`).

## Chaîne de connexion à la base de données

`SchulyDbContext` lit la chaîne de connexion nommée **`SchulyDatabase`**
(`ConnectionStrings:SchulyDatabase`), câblée dans `DatabaseExtensions`. La reprise
automatique en cas d'échec (retry-on-failure) est activée pour les erreurs transitoires
de Postgres.

Fournis-la via la configuration ou une variable d'environnement, par exemple :

```sh
export ConnectionStrings__SchulyDatabase="Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=..."
```

## Authentification OIDC

L'authentification JWT bearer valide les jetons par rapport à l'autorité OIDC
configurée (`AddSchulyAuthentication`) :

| Clé | Rôle |
|---|---|
| `Oidc:Authority` | Autorité OIDC (Keycloak) utilisée pour valider les jetons bearer. |
| `Oidc:RequireHttpsMetadata` | Indique si les métadonnées HTTPS sont requises (`true` par défaut). |

Correspondance des claims du jeton :

- `name` → nom affiché (`NameClaimType`).
- **Le claim `groups` → rôle** (`RoleClaimType`). Les valeurs de groupe correspondent
  aux rôles applicatifs **`Student`**, **`Teacher`** et **`Administrator`**.
- La validation de l'audience est désactivée (`ValidateAudience = false`).

Au premier jeton valide pour un utilisateur inconnu, l'API synchronise l'utilisateur à
partir du jeton (`AddUserSync` / `IUserService`).

### Authentification de développement (DevAuth)

En environnement Development, tu peux activer un chemin OIDC factice local plutôt
qu'un vrai fournisseur d'identité. Avec `DevAuth:Enabled = true` (voir
`appsettings.Development.json`), l'API fait confiance aux jetons émis par
`/api/dev/token`, signés avec une clé symétrique, en utilisant `DevAuth:Issuer`
(`schuly-dev` par défaut). Aucun fournisseur d'identité externe n'est contacté.
**N'active jamais DevAuth en production.**

## Document OpenAPI

`Oidc:Authority` est également lu lors de la génération du document OpenAPI, pour
annoncer le flux OAuth2 authorization-code. Il est requis même quand `DevAuth`
remplace le vrai fournisseur d'identité : sans lui, `/openapi/v1.json` renvoie **500**
(`Oidc:Authority not configured`) et l'interface Scalar apparaît vide, puisqu'elle
affiche ce document. `Oidc:ClientId` préremplit l'identifiant client dans la boîte de
dialogue d'autorisation de l'interface de référence.

## Stockage de documents (S3)

Les blobs de documents et d'avatars vont vers un bucket compatible S3 (SeaweedFS dans
les piles fournies), configuré sous `S3:` :

| Clé | Rôle |
|---|---|
| `S3:Endpoint` | Endpoint S3, par ex. `http://localhost:8333`. |
| `S3:Bucket` | Nom du bucket. |
| `S3:AccessKey` / `S3:SecretKey` | Identifiants. Doivent correspondre au `s3-config.json` de SeaweedFS. |
| `S3:UsePathStyle` | `true` pour SeaweedFS et la plupart des implémentations S3 auto-hébergées. |

## Signature des URL d'avatar

| Clé | Rôle |
|---|---|
| `Avatar:SigningKey` | Clé HMAC pour les URL d'avatar signées à courte durée de vie. Génère-la avec `openssl rand -hex 32`. |

La base de données ne stocke qu'une simple clé de blob ; une URL de capacité signée est
générée à chaque accès. La clé est lue de façon paresseuse (lazy), donc une valeur
manquante ne se manifeste que sous la forme `Avatar:SigningKey is not configured.` la
première fois qu'une URL d'avatar est signée, plutôt qu'au démarrage.

## Politique d'autorisation

La politique par défaut (de repli) **exige un utilisateur authentifié pour chaque
endpoint** (`AddSchulyAuthorization`). Les endpoints s'en dispensent avec
`[AllowAnonymous]`. La surface anonyme `/api/app` (par ex. le catalogue des systèmes
scolaires et les ressources statiques de logo sous `wwwroot`) est accessible sans
authentification, afin que l'application puisse charger son catalogue de connexion.
Les endpoints d'administration des plugins sous `/api/plugins` requièrent le rôle
`Administrator`.

## Plugins

La configuration de l'hôte de plugins (URL du registre, fichier des plugins désirés,
répertoires) est décrite dans [Gestion des plugins](../plugin-management.md).

## Journalisation

Les niveaux de journalisation sont définis sous `Logging:LogLevel` dans
`appsettings.json`. La surcharge Development relève la journalisation HTTP à
`Information` pour le traçage des requêtes.
