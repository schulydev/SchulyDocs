# Configuration

La configuration provient de `appsettings.json`, de surcharges propres à
l'environnement (`appsettings.Development.json`), des secrets utilisateur (user
secrets), et des variables d'environnement, selon l'ordre de priorité standard d'ASP.NET
Core (les variables d'environnement l'emportent sur les secrets utilisateur, qui
l'emportent sur `appsettings.{Environment}.json`, qui l'emporte sur `appsettings.json`).

Les secrets ne sont volontairement **pas** commités : les `appsettings*.json` suivis
par git ne contiennent que les niveaux de journalisation et des valeurs par défaut non
secrètes (émetteur de la connexion, paramètres de mail locaux). En local, ce manque est
comblé avec `dotnet user-secrets set` (voir
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

## Connexion

La connexion est intégrée au serveur avec la bibliothèque
[Toamaisutaa](https://www.nuget.org/packages/Toamaisutaa.AspNetCore)
(`AddSchulyAuthentication`). Il n'y a pas de fournisseur d'identité séparé. Ses tables
vivent dans la base de données Schuly (migration `AddToamaisutaa`).

Fonctions activées : connexion par mot de passe avec inscription libre, vérification de
l'e-mail, réinitialisation du mot de passe par e-mail, double authentification TOTP
avec codes de récupération, « se souvenir de cet appareil » (appareils de confiance),
et nettoyage des jetons expirés. Les passkeys, les liens magiques, les invitations, les
comptes créés par un administrateur et les fournisseurs OIDC externes ne sont pas
activés.

Les endpoints vivent sous `/auth`, par exemple `POST /auth/register`, `/auth/login`,
`/auth/refresh`, `/auth/logout`, `/auth/password`, `/auth/password/forgot`,
`/auth/password/reset`, `/auth/email`, `/auth/email/verify`, `/auth/2fa/*` et
`/auth/devices`. L'API sous `/api/*` prend le jeton d'accès en
`Authorization: Bearer`. Les jetons d'accès vivent 15 minutes. Les jetons de
rafraîchissement changent à chaque utilisation.

L'application web (servie par le serveur lui-même) envoie l'en-tête
`X-Schuly-Client: web`. Elle reçoit alors le jeton de rafraîchissement et le jeton
d'appareil mémorisé dans des cookies `HttpOnly`, `SameSite=Strict`, limités à `/auth`.
Les autres clients, comme l'application mobile, reçoivent les jetons dans le corps
JSON.

| Clé | Rôle |
|---|---|
| `LocalLogin:SigningKey` | Clé qui signe les jetons d'accès. Base64, exactement 32 octets. |
| `TwoFactor:EncryptionKey` | Clé qui chiffre les secrets de double authentification. Base64, exactement 32 octets. |
| `LocalLogin:Issuer` / `LocalLogin:Audience` | Émetteur et audience des jetons. `appsettings.json` les fixe tous deux à `schuly`. |
| `LocalLogin:AllowSelfRegistration` | Indique si n'importe qui peut s'inscrire (`true` dans `appsettings.json`). |
| `LocalLogin:RequireVerifiedEmailForPasswordReset` | N'envoie les mails de réinitialisation qu'aux adresses vérifiées (`true` dans `appsettings.json`). |
| `TwoFactor:Issuer` | Nom affiché dans les applications d'authentification (`Schuly`). |
| `Auth:Administrators` | Liste d'e-mails ou de noms d'utilisateur qui reçoivent le rôle `Administrator` (`Auth__Administrators__0`, `__1`, ...). |

Génère les deux clés avec `openssl rand -base64 32` et garde-les stables. Une nouvelle
clé de signature déconnecte tout le monde. Une nouvelle clé de chiffrement casse la
double authentification pour chaque compte qui l'a configurée.

Tout compte absent de `Auth:Administrators` n'a aucun rôle. Au premier jeton valide
pour un utilisateur inconnu, l'API crée l'utilisateur Schuly correspondant
(`AddUserSync` / `IUserService`).

### E-mail (SMTP)

Les mails de vérification et de réinitialisation du mot de passe partent via SMTP :

| Clé | Rôle |
|---|---|
| `Email:Smtp:Host` / `Email:Smtp:Port` | Serveur de mail. |
| `Email:Smtp:User` / `Email:Smtp:Password` | Identifiants du serveur de mail. |
| `Email:Smtp:From` | Adresse d'expédition. |
| `Email:Smtp:PasswordResetLinkTemplate` | Lien dans le mail de réinitialisation, par ex. `https://<API_HOST>/reset-password?token={token}`. |
| `Email:Smtp:EmailVerificationLinkTemplate` | Lien dans le mail de vérification, par ex. `https://<API_HOST>/verify-email?token={token}`. |

En Development, `appsettings.Development.json` envoie les mails vers un capteur SMTP
local sur `localhost:1025` et construit les liens vers `http://localhost:4200`. Voir
[Mise en place du développement](development.md).

## Document OpenAPI

Le document OpenAPI utilise un schéma de sécurité HTTP bearer. Dans l'interface Scalar,
tu colles un jeton d'accès ; il n'y a pas de flux OAuth2.

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

Les utilisateurs envoient une photo de profil avec `PUT /api/me/avatar` (multipart,
PNG, JPEG ou WebP, 2 Mo max.) et la suppriment avec `DELETE /api/me/avatar`. Le
fichier va dans le stockage de documents (S3) et est servi via des URL signées à courte
durée de vie sous `/api/avatars/users/{id}`.

La base de données ne stocke qu'une simple clé de blob ; une URL de capacité signée est
générée à chaque accès. La clé est lue de façon paresseuse (lazy), donc une valeur
manquante ne se manifeste que sous la forme `Avatar:SigningKey is not configured.` la
première fois qu'une URL d'avatar est signée, plutôt qu'au démarrage.

## Rétention

Un service hébergé purge les données expirées une fois par jour, cinq minutes après le
démarrage puis toutes les 24 heures. Il réutilise le même code de purge que
`DELETE /api/auth/me`, donc une ligne purgée ne laisse rien derrière elle dans Postgres
ni dans S3.

| Clé | Rôle |
|---|---|
| `Retention:Enabled` | Indique si la purge s'exécute (`true` par défaut). |
| `Retention:MonthsAfterLeave` | Les données scolaires en cache sont supprimées pour les utilisateurs scolaires dont la `LeaveDate` est plus ancienne que cette durée (`6` par défaut). |
| `Retention:MonthsInactive` | Les comptes sans requête authentifiée pendant cette durée sont supprimés (`12` par défaut). |

« Inactif » se mesure avec `ApplicationUser.LastSeenAt`, mis à jour depuis le pipeline
de validation JWT au plus une fois par heure, pour qu'un client actif n'écrive pas à
chaque requête. Un compte jamais mis à jour se rabat sur son `CreatedAt`.

La purge ne supprime que les données Schuly, pas le compte de connexion. Un compte
purgé pour inactivité peut donc se reconnecter et tout resynchroniser depuis zéro.

## Notifications push (Firebase)

La boîte d'envoi des notifications (notes, absences, changements d'agenda) est vidée
par un service de fond et livrée via Firebase Cloud Messaging.

| Clé | Rôle |
|---|---|
| `Firebase:ServiceAccountJson` | Base64 du JSON du compte de service Firebase. |
| `Firebase:ServiceAccountPath` | Chemin vers le fichier JSON du compte de service, en alternative à la valeur en ligne. |

Si aucune des deux n'est définie, le backend journalise une fois au démarrage que les
notifications push sont désactivées, puis ne fait plus rien. Les déploiements sans
Firebase continuent donc de fonctionner. La boîte d'envoi est quand même vidée dans ce
cas, donc la table reste bornée même avec le push désactivé.

## Politique d'autorisation

La politique par défaut (de repli) **exige un utilisateur authentifié pour chaque
endpoint** (`AddSchulyAuthorization`). Les endpoints s'en dispensent avec
`[AllowAnonymous]`. La surface anonyme `/api/app` (par ex. le catalogue des systèmes
scolaires et les ressources statiques de logo sous `wwwroot`) est accessible sans
authentification, afin que l'application puisse charger son catalogue de connexion.
L'inscription, la connexion et les autres endpoints de connexion publics sous `/auth`
ne demandent pas non plus de jeton. Les endpoints d'administration des plugins sous
`/api/plugins` requièrent le rôle `Administrator`.

## Plugins

La configuration de l'hôte de plugins (URL du registre, fichier des plugins désirés,
répertoires) est décrite dans [Gestion des plugins](../plugin-management.md).

## Journalisation

Les niveaux de journalisation sont définis sous `Logging:LogLevel` dans
`appsettings.json`. La surcharge Development relève la journalisation HTTP à
`Information` pour le traçage des requêtes.
