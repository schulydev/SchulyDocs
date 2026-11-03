# Configurazione

Usa questa pagina per consultare le impostazioni del server. Le impostazioni provengono da queste fonti, e ognuna
sovrascrive quelle successive:

1. Variabili d'ambiente
2. User secrets
3. `appsettings.{Environment}.json`
4. `appsettings.json`

I file `appsettings*.json` tracciati contengono solo i livelli di logging e valori predefiniti non segreti, come
l'issuer dell'accesso e le impostazioni mail locali. Imposta i segreti altrove:

- **In locale:** usa `dotnet user-secrets set`. Vedi [Setup di sviluppo](development.md).
- **In un container:** usa le variabili d'ambiente, con `__` come separatore di sezione, ad esempio
  `ConnectionStrings__SchulyDatabase`.

## Stringa di connessione al database

`SchulyDbContext` legge la stringa di connessione denominata `SchulyDatabase`
(`ConnectionStrings:SchulyDatabase`), collegata in `DatabaseExtensions`. Il nuovo tentativo in caso di errore è attivo per
gli errori transitori di Postgres.

```sh
export ConnectionStrings__SchulyDatabase="Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=..."
```

## Accesso {#sign-in}

L'accesso è integrato nel server con la libreria
[Toamaisutaa](https://www.nuget.org/packages/Toamaisutaa.AspNetCore)
(`AddSchulyAuthentication`). Non c'è un identity provider separato. Le sue tabelle si trovano nel
database di Schuly (migrazione `AddToamaisutaa`).

**Attivi:** accesso con password con registrazione autonoma, verifica dell'email, reimpostazione della password via email,
autenticazione a due fattori TOTP con codici di recupero, "ricorda questo dispositivo" (dispositivi attendibili), single sign-on facoltativo
tramite provider OIDC e pulizia dei token scaduti.

**Non attivi:** passkey, magic link, inviti e account creati dall'amministratore.

**Endpoint:** si trovano sotto `/auth`, ad esempio `POST /auth/register`, `/auth/login`, `/auth/refresh`,
`/auth/logout`, `/auth/password`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/email`,
`/auth/email/verify`, `/auth/2fa/*`, `/auth/devices`, `/auth/providers` e `/auth/external/*`.

**Token:** l'API sotto `/api/*` accetta l'access token come `Authorization: Bearer`. Gli access token durano
15 minuti. I refresh token ruotano a ogni utilizzo.

**Client:** l'app web, servita dal server stesso, invia l'header `X-Schuly-Client: web`. Riceve
il refresh token e il token del dispositivo ricordato in cookie `HttpOnly`, `SameSite=Strict` limitati
a `/auth`. Gli altri client, come l'app mobile, ricevono i token nel corpo JSON.

| Chiave | Scopo |
|---|---|
| `LocalLogin:SigningKey` | Firma gli access token. Base64, esattamente 32 byte. |
| `TwoFactor:EncryptionKey` | Cifra i segreti dell'autenticazione a due fattori. Base64, esattamente 32 byte. |
| `LocalLogin:Issuer`, `LocalLogin:Audience` | Issuer e audience dei token. `appsettings.json` li imposta entrambi a `schuly`. |
| `LocalLogin:AllowSelfRegistration` | Se chiunque può registrarsi (`true` in `appsettings.json`). |
| `LocalLogin:RequireVerifiedEmailForSignIn` | Se l'accesso richiede un indirizzo verificato (`true` in `appsettings.json`). |
| `LocalLogin:RequireVerifiedEmailForPasswordReset` | Invia le mail di reimpostazione solo agli indirizzi verificati (`true` in `appsettings.json`). |
| `TwoFactor:Issuer` | Nome mostrato nelle app di autenticazione (`Schuly`). |

Genera entrambe le chiavi con `openssl rand -base64 32` e tienile stabili. Una nuova chiave di firma disconnette
tutti. Una nuova chiave di cifratura rompe l'autenticazione a due fattori per ogni account che l'ha configurata.

Non esiste un ruolo di amministratore. Al primo token valido per un utente sconosciuto, l'API crea l'utente
Schuly corrispondente (`AddUserSync`, `IUserService`).

### Single sign-on (provider OIDC) {#single-sign-on-oidc-providers}

Il single sign-on è facoltativo. Configura zero, uno o più provider OIDC: Google, Microsoft, Authentik,
Pocket ID, Keycloak o qualsiasi issuer con un documento di discovery. Senza provider, l'app web e l'app mobile
mostrano solo il modulo della password. Ogni provider compare come pulsante "Continue with ...". Gli utenti che hanno effettuato l'accesso collegano
o scollegano i provider sotto **Settings → Security** nell'app web.

| Chiave | Scopo |
|---|---|
| `ExternalLogin:Providers:<key>:DisplayName` | Etichetta del pulsante. Il valore predefinito è la chiave. |
| `ExternalLogin:Providers:<key>:IconUrl` | Icona del pulsante: qualsiasi URL di immagine, o un percorso servito dal server. Se è vuoto, le authority di Google (`https://accounts.google.com`) e Microsoft (`login.microsoftonline.com`, `login.live.com`) ricevono il loro logo. |
| `ExternalLogin:Providers:<key>:Authority` | L'issuer, come `https://accounts.google.com`. Deve essere `https://` fuori da Development. |
| `ExternalLogin:Providers:<key>:ClientId`, `ClientSecret` | Il client emesso dal provider. Ometti il segreto per un client pubblico. |
| `ExternalLogin:Providers:<key>:Scopes` | Il valore predefinito è `openid profile email`. |
| `ExternalLogin:Providers:<key>:AllowSignUp` | Se un primo accesso può creare un account. `false` per impostazione predefinita, quindi solo gli account che hanno collegato il provider possono usarlo. |
| `ExternalLogin:Providers:<key>:TrustEmailVerified` | Se un indirizzo che questo provider segna come `email_verified` vale come email dell'account quando l'account non ha un indirizzo verificato. Senza questa impostazione, gli account creati tramite il provider non hanno un'email. Attivala solo per i provider che verificano davvero gli indirizzi. |
| `ExternalLogin:Providers:<key>:LinkByVerifiedEmail` | Se un primo accesso si unisce all'account che ha già l'indirizzo verificato del provider. Attivala solo per i provider che verificano davvero gli indirizzi. |
| `ExternalLogin:AllowedReturnUrls` | URL esatti a cui un accesso concluso può tornare (`ExternalLogin__AllowedReturnUrls__0`, `__1` e così via). |
| `ExternalLogin:CallbackBaseUrl` | Schema e host pubblici del server, quando un proxy non li inoltra. |

`AllowedReturnUrls` ha bisogno di queste voci:

- `https://<API_HOST>/login`: accesso nell'app web
- `https://<API_HOST>/settings`: collegamento di un provider nell'app web
- `schuly://auth/callback`: accesso nell'app mobile (`schuly-dev://auth/callback` per la build dev)

Presso ogni provider, registra `https://<API_HOST>/auth/external/<key>/callback` come URI di reindirizzamento. Ogni
collegamento memorizza la chiave, quindi non rinominarla in seguito.

### Email (SMTP)

Le mail di verifica e di reimpostazione della password vengono inviate tramite SMTP:

| Chiave | Scopo |
|---|---|
| `Email:Smtp:Host`, `Email:Smtp:Port` | Server di posta. |
| `Email:Smtp:Security` | Sicurezza della connessione. `appsettings.Development.json` imposta `None`. |
| `Email:Smtp:User`, `Email:Smtp:Password` | Credenziali del server di posta. |
| `Email:Smtp:From` | Indirizzo del mittente. |
| `Email:Smtp:FromDisplayName` | Nome del mittente (`Schuly` in `appsettings.json`). |
| `Email:Smtp:PasswordResetLinkTemplate` | Link nella mail di reimpostazione, come `https://<API_HOST>/reset-password?token={token}`. |
| `Email:Smtp:EmailVerificationLinkTemplate` | Link nella mail di verifica, come `https://<API_HOST>/verify-email?token={token}`. |

In Development, `appsettings.Development.json` invia le mail a un catcher SMTP locale su `localhost:1025` e
crea link verso `http://localhost:4200`. Vedi [Setup di sviluppo](development.md).

## Documento OpenAPI

Il documento OpenAPI usa uno schema di sicurezza HTTP bearer. Nella UI di Scalar, incolli un access token.
Non c'è nessun flusso OAuth2.

## Storage dei documenti (S3) {#document-storage-s3}

I blob di documenti e avatar vanno in un bucket compatibile con S3, che negli stack inclusi è SeaweedFS.

| Chiave | Scopo |
|---|---|
| `S3:Endpoint` | Endpoint S3, come `http://localhost:8333`. |
| `S3:Bucket` | Nome del bucket. |
| `S3:AccessKey`, `S3:SecretKey` | Credenziali. Devono corrispondere a `s3-config.json` di SeaweedFS. |
| `S3:UsePathStyle` | `true` per impostazione predefinita. Usa `true` per SeaweedFS e per la maggior parte delle implementazioni S3 self-hosted. |
| `Documents:EncryptionKey` | Cifra i documenti prima che raggiungano il bucket. Generala con `openssl rand -base64 32`. Obbligatoria fuori da Development. Se la perdi, i documenti memorizzati diventano illeggibili. |
| `Documents:KeyVersion`, `Documents:PreviousKeys:<version>` | Versione corrente della chiave (predefinita `1`) e chiavi precedenti, così i documenti cifrati con esse restano leggibili. |

## Firma degli URL degli avatar {#avatar-url-signing}

| Chiave | Scopo |
|---|---|
| `Avatar:SigningKey` | Chiave HMAC per gli URL firmati di breve durata degli avatar. Generala con `openssl rand -hex 32`. |

Gli utenti caricano un'immagine del profilo con `PUT /api/me/avatar` (multipart; PNG, JPEG o WebP; al massimo 2 MB)
e la rimuovono con `DELETE /api/me/avatar`. Il file va nello storage dei documenti e viene servito tramite
URL firmati di breve durata sotto `/api/avatars/users/{id}`.

Il database memorizza solo una semplice chiave del blob, e il server crea un URL firmato a ogni accesso. Il server
legge la chiave in modo lazy. Se manca, vedi `Avatar:SigningKey is not configured.` la prima volta che viene firmato un
URL di un avatar, non all'avvio.

## Vault dei plugin

| Chiave | Scopo |
|---|---|
| `Vault:MasterKey` | Cifra le credenziali memorizzate dei plugin. Base64, esattamente 32 byte. Generala con `openssl rand -base64 32`. |

Fuori da Development, il server rifiuta di avviarsi senza una chiave valida. Tieni stabile la chiave: con una nuova
chiave, le credenziali memorizzate diventano illeggibili. In Development, una chiave mancante o non valida scrive un avviso nel log e il
server usa una chiave temporanea, quindi le credenziali memorizzate non sopravvivono a un riavvio.

## Conservazione

Un servizio ospitato elimina i dati scaduti cinque minuti dopo l'avvio e poi ogni 24 ore. Usa lo
stesso codice di eliminazione di `DELETE /api/auth/me`, quindi una riga eliminata non lascia nulla in Postgres o in S3.

| Chiave | Scopo |
|---|---|
| `Retention:Enabled` | Se l'eliminazione viene eseguita (predefinito `true`). |
| `Retention:MonthsAfterLeave` | Elimina i dati scolastici in cache degli school user il cui `LeaveDate` è più vecchio di questo valore (predefinito `6`). |
| `Retention:MonthsInactive` | Elimina i dati Schuly degli account senza richieste autenticate per questo periodo, non l'account di accesso (predefinito `12`). |

`ApplicationUser.LastSeenAt` misura l'inattività. La pipeline di validazione dei JWT lo aggiorna al massimo una volta
all'ora, così un client attivo non scrive a ogni richiesta. Un account che non è mai stato aggiornato usa il suo
`CreatedAt`.

L'account di accesso resta, quindi un account eliminato può accedere di nuovo e risincronizzare da zero.

## Notifiche push (Firebase) {#push-notifications-firebase}

Un servizio in background svuota l'outbox delle notifiche (note, assenze, modifiche all'agenda) e le recapita
tramite Firebase Cloud Messaging.

| Chiave | Scopo |
|---|---|
| `Firebase:ServiceAccountJson` | Base64 del JSON del service account Firebase. |
| `Firebase:ServiceAccountPath` | Percorso del file JSON del service account, in alternativa al valore inline. |

Se nessuna delle due è impostata, il backend scrive una volta nel log all'avvio che le notifiche push sono disattivate e non invia nulla, così
i deployment senza Firebase continuano a funzionare. Svuota comunque l'outbox, così la tabella resta limitata.

## Helply {#helply}

Helply è l'assistente IA facoltativo. Ha bisogno di un gateway chat-completions compatibile con OpenAI.

| Chiave | Scopo |
|---|---|
| `Helply:BaseUrl` | URL del gateway. `http` o `https` assoluto. |
| `Helply:ApiKey` | Chiave API del gateway. |
| `Helply:Model` | Facoltativo. Senza di esso, il server prova i modelli elencati dal gateway e usa il primo che risponde alle chiamate di strumenti. |

`BaseUrl` e `ApiKey` insieme attivano Helply. Queste tre impostazioni non hanno un valore predefinito. Impostale solo come
variabili d'ambiente (`Helply__BaseUrl`, `Helply__ApiKey`, `Helply__Model`), mai in appsettings.
Senza di esse, il server scrive nel log che Helply è disattivato e gli utenti lo vedono disattivato.

### Limiti

Queste chiavi si trovano sotto `Helply:Limits`.

| Chiave | Predefinito | Scopo |
|---|---|---|
| `MessagesPerMinute` | `10` | Messaggi per utente al minuto. |
| `MessagesPerDay` | `200` | Messaggi per utente al giorno. |
| `MaxInputChars` | `4000` | Messaggio più lungo. |
| `RunTimeoutSeconds` | `120` | Tempo a disposizione per un turno. |
| `RunTimeoutSecondsWithWorkspace` | `300` | Tempo a disposizione per un turno con il workspace. |
| `MaxToolIterations` | `8` | Chiamate di strumenti andata e ritorno in un turno. |
| `MaxToolIterationsWithWorkspace` | `16` | Chiamate di strumenti andata e ritorno in un turno con il workspace. |
| `MaxHistoryMessages` | `40` | Messaggi precedenti inviati al modello. |
| `MaxHistoryChars` | `60000` | Testo precedente inviato al modello. |
| `MaxOutputTokens` | `2048` | Risposta più lunga. |
| `MaxToolResultChars` | `16000` | Risultato di strumento più lungo nel prompt. I risultati più lunghi vengono tagliati con una nota. |
| `MaxToolArgumentChars` | `20000` | Argomenti di strumento serializzati più lunghi. Le chiamate più grandi vengono rifiutate. |
| `MaxAttachmentTextChars` | `30000` | Quantità massima di testo di un allegato nel prompt. |
| `MaxAttachmentTextTotalChars` | `60000` | Quantità massima di testo degli allegati in una richiesta al modello. |
| `MaxNativeBytesPerRequest` | `12000000` | Quantità massima di byte di file (immagini, PDF) inviati come file in una richiesta al modello. |

### Workspace

Il workspace permette a Helply di eseguire codice in una sandbox. Ha bisogno di `Helply:Sandbox:BaseUrl` e
`Helply:Sandbox:ApiKey`, che deve avere almeno 32 caratteri. Impostali come variabili d'ambiente
(`Helply__Sandbox__BaseUrl`, `Helply__Sandbox__ApiKey`). Vedi il
[README di deploy](https://github.com/schulydev/SchulyServer/blob/main/deploy/README.md) per la configurazione.

## Server MCP {#mcp-server}

Il server espone MCP su `/mcp`, così gli utenti possono collegare app di IA.

| Chiave | Scopo |
|---|---|
| `Mcp:PublicUrl` | L'origine pubblica e l'audience di ogni token MCP. Impostala nei deployment. Senza di essa, il server ricava l'origine da ogni richiesta. |
| `Mcp:AllowedOrigins` | Origini del browser ammesse da CORS, oltre a quella del server (`Mcp__AllowedOrigins__0`, `__1` e così via). I caratteri jolly non sono supportati. |

Di norma imposti solo queste due. Le durate dei token e i limiti si trovano anch'essi sotto `Mcp:` e hanno valori predefiniti funzionanti (`McpOAuthOptions`).

## Limitare le registrazioni alla Svizzera

Imposta `SignUp:SwitzerlandOnly` su `true` (`SignUp__SwitzerlandOnly=true` in `config/backend.env`) per accettare nuovi account solo da reti svizzere. Di default è disattivato.

- Le registrazioni con password da altre reti ricevono un errore. Il server confronta l'indirizzo solo con un elenco integrato, senza salvarlo né registrarlo nei log.
- I provider OIDC non possono creare account, qualunque sia il valore di `AllowSignUp`. Gli account che hanno già collegato un provider continuano a usarlo.
- Gli account esistenti continuano a funzionare ovunque. La modalità privata non ha un account e quindi non è interessata.
- Un indirizzo svizzero deve raggiungere il server. Dietro un proxy, imposta correttamente `ForwardedHeaders:KnownNetworks`, altrimenti ogni registrazione viene rifiutata.

L'elenco proviene dai dati del registro RIPE, che indicano dove è registrata una rete, quindi non è esatto. Una VPN può aggirarlo. Per aggiornare l'elenco prima di una release, esegui `scripts/update-swiss-networks.sh`.

## Criterio di autorizzazione

Il criterio di fallback richiede un utente autenticato per ogni endpoint (`AddSchulyAuthorization`).
Gli endpoint se ne escludono con `[AllowAnonymous]`. Questi non hanno bisogno di un token:

- La superficie anonima `/api/app`, come il catalogo dei sistemi scolastici e i loghi statici sotto
  `wwwroot`, così l'app può caricare il suo catalogo di login.
- Registrazione, login e gli altri endpoint pubblici di accesso sotto `/auth`.

## Plugin

Vedi [Gestione dei plugin](../plugin-management.md) per l'URL del registro, il file dei plugin desiderati e le
directory.

## Logging

Imposta i livelli di log sotto `Logging:LogLevel` in `appsettings.json`. L'override di Development alza il logging HTTP
a `Information` per il tracciamento delle richieste.
