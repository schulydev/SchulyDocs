# Configurazione

La configurazione proviene da `appsettings.json`, dagli override specifici per
ambiente (`appsettings.Development.json`), dai user secrets e dalle variabili
d'ambiente, secondo la precedenza standard di ASP.NET Core (le variabili d'ambiente
sovrascrivono i user secrets, che sovrascrivono `appsettings.{Environment}.json`,
che sovrascrive `appsettings.json`).

I segreti non vengono deliberatamente inclusi nei commit: gli `appsettings*.json`
tracciati contengono solo i livelli di logging e valori predefiniti non segreti
(issuer dell'accesso, impostazioni mail locali). In locale questo vuoto viene colmato
con `dotnet user-secrets set` (vedi [Setup di sviluppo](development.md)); in un
container viene colmato con variabili d'ambiente, usando `__` come separatore di
sezione (`ConnectionStrings__SchulyDatabase`).

## Stringa di connessione al database

`SchulyDbContext` legge la stringa di connessione denominata **`SchulyDatabase`**
(`ConnectionStrings:SchulyDatabase`), cablata in `DatabaseExtensions`. Il retry
automatico in caso di errore è abilitato per gli errori transitori di Postgres.

Forniscila tramite configurazione o una variabile d'ambiente, ad es.:

```sh
export ConnectionStrings__SchulyDatabase="Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=..."
```

## Accesso

L'accesso è integrato nel server tramite la libreria
[Toamaisutaa](https://www.nuget.org/packages/Toamaisutaa.AspNetCore)
(`AddSchulyAuthentication`). Non c'è un identity provider separato. Le sue tabelle si
trovano nel database di Schuly (migrazione `AddToamaisutaa`).

Funzioni abilitate: accesso con password con registrazione autonoma, verifica
dell'email, reimpostazione della password via email, autenticazione a due fattori
TOTP con codici di recupero, "ricorda questo dispositivo" (dispositivi attendibili) e
pulizia dei token scaduti. Passkey, magic link, inviti, account creati
dall'amministratore e provider OIDC esterni non sono abilitati.

Gli endpoint si trovano sotto `/auth`, ad esempio `POST /auth/register`, `/auth/login`,
`/auth/refresh`, `/auth/logout`, `/auth/password`, `/auth/password/forgot`,
`/auth/password/reset`, `/auth/email`, `/auth/email/verify`, `/auth/2fa/*` e
`/auth/devices`. L'API sotto `/api/*` accetta l'access token come
`Authorization: Bearer`. Gli access token durano 15 minuti. I refresh token ruotano a
ogni utilizzo.

La web app (servita dal server stesso) invia l'header `X-Schuly-Client: web`. Riceve
così il refresh token e il token del dispositivo ricordato in cookie `HttpOnly`,
`SameSite=Strict` limitati a `/auth`. Gli altri client, come l'app mobile, ricevono i
token nel corpo JSON.

| Chiave | Scopo |
|---|---|
| `LocalLogin:SigningKey` | Chiave che firma gli access token. Base64, esattamente 32 byte. |
| `TwoFactor:EncryptionKey` | Chiave che cifra i segreti della verifica in due passaggi. Base64, esattamente 32 byte. |
| `LocalLogin:Issuer` / `LocalLogin:Audience` | Issuer e audience dei token. `appsettings.json` li imposta entrambi a `schuly`. |
| `LocalLogin:AllowSelfRegistration` | Se chiunque può registrarsi (`true` in `appsettings.json`). |
| `LocalLogin:RequireVerifiedEmailForPasswordReset` | Invia le mail di reimpostazione solo agli indirizzi verificati (`true` in `appsettings.json`). |
| `TwoFactor:Issuer` | Nome mostrato nelle app di autenticazione (`Schuly`). |
| `Auth:Administrators` | Elenco di email o nomi utente che ricevono il ruolo `Administrator` (`Auth__Administrators__0`, `__1`, ...). |

Genera entrambe le chiavi con `openssl rand -base64 32` e mantienile stabili. Una
nuova chiave di firma disconnette tutti. Una nuova chiave di cifratura rompe la
verifica in due passaggi per ogni account che l'ha configurata.

Ogni account non elencato in `Auth:Administrators` non ha alcun ruolo. Al primo token
valido per un utente sconosciuto, l'API crea l'utente Schuly corrispondente
(`AddUserSync` / `IUserService`).

### Email (SMTP)

Le mail di verifica e di reimpostazione della password vengono inviate via SMTP:

| Chiave | Scopo |
|---|---|
| `Email:Smtp:Host` / `Email:Smtp:Port` | Server di posta. |
| `Email:Smtp:User` / `Email:Smtp:Password` | Credenziali del server di posta. |
| `Email:Smtp:From` | Indirizzo del mittente. |
| `Email:Smtp:PasswordResetLinkTemplate` | Link nella mail di reimpostazione, ad es. `https://<API_HOST>/reset-password?token={token}`. |
| `Email:Smtp:EmailVerificationLinkTemplate` | Link nella mail di verifica, ad es. `https://<API_HOST>/verify-email?token={token}`. |

In Development, `appsettings.Development.json` indirizza la posta a un catcher SMTP
locale su `localhost:1025` e costruisce i link verso `http://localhost:4200`. Vedi
[Setup di sviluppo](development.md).

## Documento OpenAPI

Il documento OpenAPI usa uno schema di sicurezza HTTP bearer. Nella UI Scalar incolli
un access token; non c'è alcun flusso OAuth2.

## Storage dei documenti (S3)

I blob di documenti e avatar vanno in un bucket compatibile S3 (SeaweedFS negli
stack inclusi), configurato sotto `S3:`:

| Chiave | Scopo |
|---|---|
| `S3:Endpoint` | Endpoint S3, ad es. `http://localhost:8333`. |
| `S3:Bucket` | Nome del bucket. |
| `S3:AccessKey` / `S3:SecretKey` | Credenziali. Devono corrispondere a quelle nel `s3-config.json` di SeaweedFS. |
| `S3:UsePathStyle` | `true` per SeaweedFS e la maggior parte delle implementazioni S3 self-hosted. |

## Firma degli URL degli avatar

| Chiave | Scopo |
|---|---|
| `Avatar:SigningKey` | Chiave HMAC per gli URL firmati e di breve durata degli avatar. Generala con `openssl rand -hex 32`. |

Gli utenti caricano un'immagine del profilo con `PUT /api/me/avatar` (multipart, PNG,
JPEG o WebP, max 2 MB) e la rimuovono con `DELETE /api/me/avatar`. Il file va nello
storage dei documenti (S3) e viene servito tramite URL firmati di breve durata sotto
`/api/avatars/users/{id}`.

Il database conserva solo una chiave blob nuda; un URL di capability firmato viene
generato a ogni accesso. La chiave viene letta in modo lazy, quindi un valore
mancante emerge come `Avatar:SigningKey is not configured.` alla prima firma di un
URL avatar, non all'avvio.

## Conservazione dei dati

Un hosted service elimina i dati scaduti una volta al giorno, cinque minuti dopo
l'avvio e poi ogni 24 ore. Riusa lo stesso codice di eliminazione di
`DELETE /api/auth/me`, quindi una riga eliminata non lascia nulla in Postgres o in S3.

| Chiave | Scopo |
|---|---|
| `Retention:Enabled` | Se la pulizia viene eseguita (predefinito `true`). |
| `Retention:MonthsAfterLeave` | I dati scolastici in cache vengono eliminati per gli utenti scolastici il cui `LeaveDate` è più vecchio di così (predefinito `6`). |
| `Retention:MonthsInactive` | Gli account senza richieste autenticate per questo periodo vengono eliminati (predefinito `12`). |

"Inattivo" si misura con `ApplicationUser.LastSeenAt`, aggiornato dalla pipeline di
convalida JWT al massimo una volta all'ora, così un client molto attivo non scrive a
ogni richiesta. Un account mai aggiornato usa il proprio `CreatedAt`.

La pulizia elimina solo i dati di Schuly, non l'account di accesso, quindi un account
eliminato per inattività può accedere di nuovo e risincronizzare da zero.

## Notifiche push (Firebase)

La outbox delle notifiche (voti, assenze, modifiche all'agenda) viene svuotata da un
servizio in background e consegnata tramite Firebase Cloud Messaging.

| Chiave | Scopo |
|---|---|
| `Firebase:ServiceAccountJson` | Base64 del JSON del service account Firebase. |
| `Firebase:ServiceAccountPath` | Percorso del file JSON del service account, in alternativa al valore inline. |

Se nessuna delle due è impostata, il backend registra una volta all'avvio che le
notifiche push sono disabilitate e da quel momento non fa nulla, così i deployment
senza Firebase continuano a funzionare. La outbox viene comunque svuotata, quindi la
tabella resta limitata anche con il push disattivato.

## Policy di autorizzazione

La policy predefinita (di fallback) **richiede un utente autenticato per ogni
endpoint** (`AddSchulyAuthorization`). Gli endpoint possono escludersi con
`[AllowAnonymous]`. La superficie anonima `/api/app` (ad es. il catalogo dei
sistemi scolastici e gli asset statici dei loghi sotto `wwwroot`) è raggiungibile
senza autenticazione, così che l'app possa caricare il proprio catalogo di login.
Anche la registrazione, il login e gli altri endpoint pubblici di accesso sotto
`/auth` non richiedono alcun token. Gli endpoint di amministrazione dei plugin sotto
`/api/plugins` richiedono il ruolo `Administrator`.

## Plugin

La configurazione dell'host dei plugin (URL del registro, file dei plugin
desiderati, directory) è descritta in [Gestione dei plugin](../plugin-management.md).

## Logging

I livelli di logging sono impostati sotto `Logging:LogLevel` in `appsettings.json`.
L'override di Development eleva il logging HTTP a `Information` per il tracing
delle richieste.
