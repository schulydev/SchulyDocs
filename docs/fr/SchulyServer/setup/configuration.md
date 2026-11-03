# Configuration

Utilise cette page pour consulter les paramètres du serveur. Les paramètres viennent de ces sources, et chacune
l'emporte sur celles qui la suivent :

1. Variables d'environnement
2. Secrets utilisateur
3. `appsettings.{Environment}.json`
4. `appsettings.json`

Les fichiers `appsettings*.json` suivis par git ne contiennent que les niveaux de journalisation et des valeurs
par défaut non secrètes, comme l'émetteur de la connexion et les paramètres de mail locaux. Définis les secrets
ailleurs :

- **En local :** utilise `dotnet user-secrets set`. Voir [Configuration de développement](development.md).
- **Dans un conteneur :** utilise des variables d'environnement, avec `__` comme séparateur de section, comme
  `ConnectionStrings__SchulyDatabase`.

## Chaîne de connexion à la base de données

`SchulyDbContext` lit la chaîne de connexion nommée `SchulyDatabase`
(`ConnectionStrings:SchulyDatabase`), câblée dans `DatabaseExtensions`. La reprise après échec est activée pour
les erreurs transitoires de Postgres.

```sh
export ConnectionStrings__SchulyDatabase="Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=..."
```

## Connexion {#sign-in}

La connexion est intégrée au serveur avec la bibliothèque
[Toamaisutaa](https://www.nuget.org/packages/Toamaisutaa.AspNetCore)
(`AddSchulyAuthentication`). Il n'y a pas de fournisseur d'identité séparé. Ses tables se trouvent dans la base
de données Schuly (migration `AddToamaisutaa`).

**Activé :** connexion par mot de passe avec inscription libre, vérification de l'e-mail, réinitialisation du mot
de passe par e-mail, double authentification TOTP avec codes de récupération, « se souvenir de cet appareil »
(appareils de confiance), authentification unique optionnelle par des fournisseurs OIDC et nettoyage des jetons
expirés.

**Non activé :** passkeys, liens magiques, invitations et comptes créés par un administrateur.

**Points d'entrée :** ils se trouvent sous `/auth`, comme `POST /auth/register`, `/auth/login`, `/auth/refresh`,
`/auth/logout`, `/auth/password`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/email`,
`/auth/email/verify`, `/auth/2fa/*`, `/auth/devices`, `/auth/providers` et `/auth/external/*`.

**Jetons :** l'API sous `/api/*` prend le jeton d'accès dans `Authorization: Bearer`. Les jetons d'accès durent
15 minutes. Les jetons de rafraîchissement changent à chaque utilisation.

**Clients :** l'application web, que le serveur sert lui-même, envoie l'en-tête `X-Schuly-Client: web`. Elle
reçoit le jeton de rafraîchissement et le jeton d'appareil mémorisé dans des cookies `HttpOnly`,
`SameSite=Strict` limités à `/auth`. Les autres clients, comme l'application mobile, reçoivent les jetons dans le
corps JSON.

| Clé | Rôle |
|---|---|
| `LocalLogin:SigningKey` | Signe les jetons d'accès. Base64, exactement 32 octets. |
| `TwoFactor:EncryptionKey` | Chiffre les secrets de double authentification. Base64, exactement 32 octets. |
| `LocalLogin:Issuer`, `LocalLogin:Audience` | Émetteur et audience des jetons. `appsettings.json` définit les deux à `schuly`. |
| `LocalLogin:AllowSelfRegistration` | Si tout le monde peut s'inscrire (`true` dans `appsettings.json`). |
| `LocalLogin:RequireVerifiedEmailForSignIn` | Si la connexion exige une adresse vérifiée (`true` dans `appsettings.json`). |
| `LocalLogin:RequireVerifiedEmailForPasswordReset` | Envoie les mails de réinitialisation uniquement aux adresses vérifiées (`true` dans `appsettings.json`). |
| `TwoFactor:Issuer` | Nom affiché dans les applications d'authentification (`Schuly`). |

Génère les deux clés avec `openssl rand -base64 32` et garde-les stables. Une nouvelle clé de signature déconnecte
tout le monde. Une nouvelle clé de chiffrement casse la double authentification pour chaque compte qui l'a
configurée.

Il n'y a pas de rôle d'administrateur. Au premier jeton valide d'un utilisateur inconnu, l'API crée l'utilisateur
Schuly correspondant (`AddUserSync`, `IUserService`).

### Authentification unique (fournisseurs OIDC) {#single-sign-on-oidc-providers}

L'authentification unique est optionnelle. Configure zéro, un ou plusieurs fournisseurs OIDC : Google, Microsoft,
Authentik, Pocket ID, Keycloak ou tout émetteur avec un document de découverte. Sans fournisseur, l'application
web et l'application mobile n'affichent que le formulaire de mot de passe. Chaque fournisseur apparaît comme un
bouton « Continue with ... ». Les utilisateurs connectés lient ou délient des fournisseurs sous
**Settings → Security** dans l'application web.

| Clé | Rôle |
|---|---|
| `ExternalLogin:Providers:<key>:DisplayName` | Libellé du bouton. Vaut par défaut la clé. |
| `ExternalLogin:Providers:<key>:IconUrl` | Icône du bouton : n'importe quelle URL d'image, ou un chemin que le serveur sert. Si elle est vide, les autorités Google (`https://accounts.google.com`) et Microsoft (`login.microsoftonline.com`, `login.live.com`) reçoivent leur logo. |
| `ExternalLogin:Providers:<key>:Authority` | L'émetteur, comme `https://accounts.google.com`. Doit être en `https://` hors de Development. |
| `ExternalLogin:Providers:<key>:ClientId`, `ClientSecret` | Le client que le fournisseur a émis. Laisse de côté le secret pour un client public. |
| `ExternalLogin:Providers:<key>:Scopes` | Vaut par défaut `openid profile email`. |
| `ExternalLogin:Providers:<key>:AllowSignUp` | Si une première connexion peut créer un compte. `false` par défaut, donc seuls les comptes qui ont lié le fournisseur peuvent l'utiliser. |
| `ExternalLogin:Providers:<key>:TrustEmailVerified` | Si une adresse que ce fournisseur marque `email_verified` compte comme e-mail du compte quand le compte n'a pas d'adresse vérifiée. Sans cela, les comptes créés par le fournisseur n'ont pas d'e-mail. N'active cette option que pour les fournisseurs qui vérifient vraiment les adresses. |
| `ExternalLogin:Providers:<key>:LinkByVerifiedEmail` | Si une première connexion rejoint le compte qui a déjà l'adresse vérifiée du fournisseur. N'active cette option que pour les fournisseurs qui vérifient vraiment les adresses. |
| `ExternalLogin:AllowedReturnUrls` | URL exactes vers lesquelles une connexion terminée peut revenir (`ExternalLogin__AllowedReturnUrls__0`, `__1`, etc.). |
| `ExternalLogin:CallbackBaseUrl` | Schéma et hôte publics du serveur, quand un proxy ne les transmet pas. |

`AllowedReturnUrls` a besoin de ces entrées :

- `https://<API_HOST>/login` : connexion dans l'application web
- `https://<API_HOST>/settings` : liaison d'un fournisseur dans l'application web
- `schuly://auth/callback` : connexion dans l'application mobile (`schuly-dev://auth/callback` pour le build de dev)

Chez chaque fournisseur, enregistre `https://<API_HOST>/auth/external/<key>/callback` comme URI de redirection.
Chaque liaison stocke la clé, donc ne la renomme pas plus tard.

### E-mail (SMTP)

Les mails de vérification et de réinitialisation du mot de passe partent par SMTP :

| Clé | Rôle |
|---|---|
| `Email:Smtp:Host`, `Email:Smtp:Port` | Serveur de mail. |
| `Email:Smtp:Security` | Sécurité de la connexion. `appsettings.Development.json` définit `None`. |
| `Email:Smtp:User`, `Email:Smtp:Password` | Identifiants du serveur de mail. |
| `Email:Smtp:From` | Adresse de l'expéditeur. |
| `Email:Smtp:FromDisplayName` | Nom de l'expéditeur (`Schuly` dans `appsettings.json`). |
| `Email:Smtp:PasswordResetLinkTemplate` | Lien dans le mail de réinitialisation, comme `https://<API_HOST>/reset-password?token={token}`. |
| `Email:Smtp:EmailVerificationLinkTemplate` | Lien dans le mail de vérification, comme `https://<API_HOST>/verify-email?token={token}`. |

En Development, `appsettings.Development.json` envoie les mails à un collecteur SMTP local sur `localhost:1025` et
construit les liens vers `http://localhost:4200`. Voir [Configuration de développement](development.md).

## Document OpenAPI

Le document OpenAPI utilise un schéma de sécurité HTTP bearer. Dans l'interface Scalar, tu colles un jeton d'accès.
Il n'y a pas de processus OAuth2.

## Stockage de documents (S3) {#document-storage-s3}

Les blobs de documents et d'avatars vont dans un bucket compatible S3, qui est SeaweedFS dans les stacks fournies.

| Clé | Rôle |
|---|---|
| `S3:Endpoint` | Point d'entrée S3, comme `http://localhost:8333`. |
| `S3:Bucket` | Nom du bucket. |
| `S3:AccessKey`, `S3:SecretKey` | Identifiants. Doivent correspondre au `s3-config.json` de SeaweedFS. |
| `S3:UsePathStyle` | `true` par défaut. Utilise `true` pour SeaweedFS et la plupart des implémentations S3 auto-hébergées. |
| `Documents:EncryptionKey` | Chiffre les documents avant qu'ils n'atteignent le bucket. Génère-la avec `openssl rand -base64 32`. Obligatoire hors de Development. La perdre rend les documents stockés illisibles. |
| `Documents:KeyVersion`, `Documents:PreviousKeys:<version>` | Version actuelle de la clé (`1` par défaut) et clés précédentes, pour que les documents chiffrés avec elles restent lisibles. |

## Signature des URL d'avatar {#avatar-url-signing}

| Clé | Rôle |
|---|---|
| `Avatar:SigningKey` | Clé HMAC pour les URL d'avatar signées de courte durée. Génère-la avec `openssl rand -hex 32`. |

Les utilisateurs envoient une photo de profil avec `PUT /api/me/avatar` (multipart ; PNG, JPEG ou WebP ; 2 Mo au
maximum) et la suppriment avec `DELETE /api/me/avatar`. Le fichier va dans le stockage de documents et est servi
par des URL signées de courte durée sous `/api/avatars/users/{id}`.

La base de données ne stocke qu'une simple clé de blob, et le serveur crée une URL signée à chaque accès. Le
serveur lit la clé de manière différée. Si elle manque, tu vois `Avatar:SigningKey is not configured.` la première
fois qu'une URL d'avatar est signée, pas au démarrage.

## Coffre-fort des plugins

| Clé | Rôle |
|---|---|
| `Vault:MasterKey` | Chiffre les identifiants de plugins stockés. Base64, exactement 32 octets. Génère-la avec `openssl rand -base64 32`. |

Hors de Development, le serveur refuse de démarrer sans clé valide. Garde la clé stable : avec une nouvelle clé,
les identifiants stockés deviennent illisibles. En Development, une clé manquante ou invalide journalise un
avertissement et le serveur utilise une clé temporaire, donc les identifiants stockés ne survivent pas à un
redémarrage.

## Conservation

Un service hébergé balaie les données expirées cinq minutes après le démarrage, puis toutes les 24 heures. Il
utilise le même code de purge que `DELETE /api/auth/me`, donc une ligne balayée ne laisse aucune trace dans
Postgres ni dans S3.

| Clé | Rôle |
|---|---|
| `Retention:Enabled` | Si le balayage s'exécute (`true` par défaut). |
| `Retention:MonthsAfterLeave` | Supprime les données scolaires en cache des utilisateurs scolaires dont la `LeaveDate` est plus ancienne que cette durée (`6` par défaut). |
| `Retention:MonthsInactive` | Supprime les données Schuly des comptes sans requête authentifiée pendant cette durée, mais pas le compte de connexion (`12` par défaut). |

`ApplicationUser.LastSeenAt` mesure l'inactivité. Le pipeline de validation JWT le met à jour au plus une fois par
heure, pour qu'un client très actif n'écrive pas à chaque requête. Un compte qui n'a jamais été marqué utilise sa
`CreatedAt`.

Le compte de connexion reste, donc un compte balayé peut se reconnecter et tout resynchroniser depuis le début.

## Notifications push (Firebase) {#push-notifications-firebase}

Un service en arrière-plan vide la boîte d'envoi des notifications (notes, absences, changements d'agenda) et la
livre par Firebase Cloud Messaging.

| Clé | Rôle |
|---|---|
| `Firebase:ServiceAccountJson` | Base64 du JSON du compte de service Firebase. |
| `Firebase:ServiceAccountPath` | Chemin vers le fichier JSON du compte de service, comme alternative à la valeur inline. |

Si aucun des deux n'est défini, le backend journalise une fois au démarrage que les notifications push sont
désactivées et n'envoie rien, donc les déploiements sans Firebase continuent de fonctionner. Il vide quand même la
boîte d'envoi, donc la table reste limitée.

## Helply {#helply}

Helply est l'assistant IA optionnel. Il a besoin d'une passerelle chat-completions compatible OpenAI.

| Clé | Rôle |
|---|---|
| `Helply:BaseUrl` | URL de la passerelle. `http` ou `https` absolu. |
| `Helply:ApiKey` | Clé API de la passerelle. |
| `Helply:Model` | Optionnel. Sans lui, le serveur teste les modèles que la passerelle liste et utilise le premier qui répond aux appels d'outils. |

`BaseUrl` et `ApiKey` activent Helply ensemble. Ces trois paramètres n'ont pas de valeur par défaut. Définis-les
uniquement comme variables d'environnement (`Helply__BaseUrl`, `Helply__ApiKey`, `Helply__Model`), jamais dans
appsettings. Sans eux, le serveur journalise que Helply est désactivé et les utilisateurs le voient désactivé.

### Limites

Ces clés se trouvent sous `Helply:Limits`.

| Clé | Par défaut | Rôle |
|---|---|---|
| `MessagesPerMinute` | `10` | Messages par utilisateur par minute. |
| `MessagesPerDay` | `200` | Messages par utilisateur par jour. |
| `MaxInputChars` | `4000` | Message le plus long. |
| `RunTimeoutSeconds` | `120` | Budget de temps pour un tour. |
| `RunTimeoutSecondsWithWorkspace` | `300` | Budget de temps pour un tour avec le workspace. |
| `MaxToolIterations` | `8` | Allers-retours d'outils dans un tour. |
| `MaxToolIterationsWithWorkspace` | `16` | Allers-retours d'outils dans un tour avec le workspace. |
| `MaxHistoryMessages` | `40` | Messages précédents envoyés au modèle. |
| `MaxHistoryChars` | `60000` | Texte précédent envoyé au modèle. |
| `MaxOutputTokens` | `2048` | Réponse la plus longue. |
| `MaxToolResultChars` | `16000` | Résultat d'outil le plus long dans le prompt. Les résultats plus longs sont coupés avec une note. |
| `MaxToolArgumentChars` | `20000` | Arguments d'outil sérialisés les plus longs. Les appels plus grands sont refusés. |
| `MaxAttachmentTextChars` | `30000` | Quantité maximale de texte d'une pièce jointe dans le prompt. |
| `MaxAttachmentTextTotalChars` | `60000` | Quantité maximale de texte de pièces jointes dans une requête au modèle. |
| `MaxNativeBytesPerRequest` | `12000000` | Quantité maximale d'octets de fichiers (images, PDF) envoyés comme fichiers dans une requête au modèle. |

### Workspace

Le workspace permet à Helply d'exécuter du code dans une sandbox. Il a besoin de `Helply:Sandbox:BaseUrl` et de
`Helply:Sandbox:ApiKey`, qui doit contenir au moins 32 caractères. Définis-les comme variables d'environnement
(`Helply__Sandbox__BaseUrl`, `Helply__Sandbox__ApiKey`). Voir le
[README de déploiement](https://github.com/schulydev/SchulyServer/blob/main/deploy/README.md) pour la mise en place.

## Serveur MCP {#mcp-server}

Le serveur expose MCP à `/mcp`, pour que les utilisateurs puissent connecter des applications d'IA.

| Clé | Rôle |
|---|---|
| `Mcp:PublicUrl` | L'origine publique et l'audience de chaque jeton MCP. Définis-la dans les déploiements. Sans elle, le serveur prend l'origine de chaque requête. |
| `Mcp:AllowedOrigins` | Origines de navigateur autorisées pour CORS, en plus de celle du serveur (`Mcp__AllowedOrigins__0`, `__1`, etc.). Les caractères génériques ne sont pas pris en charge. |

En général, tu ne définis que ces deux paramètres. Les durées de vie des jetons et les limites se trouvent aussi sous `Mcp:` et ont des valeurs par défaut fonctionnelles (`McpOAuthOptions`).

## Politique d'autorisation

La politique de repli exige un utilisateur authentifié pour chaque point d'entrée (`AddSchulyAuthorization`). Les
points d'entrée s'en excluent avec `[AllowAnonymous]`. Ceux-ci n'ont pas besoin de jeton :

- La surface anonyme `/api/app`, comme le catalogue des systèmes scolaires et les logos statiques sous `wwwroot`,
  pour que l'application puisse charger son catalogue de connexion.
- L'inscription, la connexion et les autres points d'entrée publics de connexion sous `/auth`.

## Plugins

Voir [Gestion des plugins](../plugin-management.md) pour l'URL du registre, le fichier des plugins souhaités et les
dossiers.

## Journalisation

Définis les niveaux de journalisation sous `Logging:LogLevel` dans `appsettings.json`. La surcharge Development
élève la journalisation HTTP à `Information` pour tracer les requêtes.
