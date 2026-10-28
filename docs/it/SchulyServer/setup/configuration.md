# Configurazione

La configurazione proviene da `appsettings.json`, dagli override specifici per
ambiente (`appsettings.Development.json`), dai user secrets e dalle variabili
d'ambiente, secondo la precedenza standard di ASP.NET Core (le variabili d'ambiente
sovrascrivono i user secrets, che sovrascrivono `appsettings.{Environment}.json`,
che sovrascrive `appsettings.json`).

I segreti non vengono deliberatamente inclusi nei commit: gli `appsettings*.json`
tracciati contengono solo i livelli di logging e `DevAuth`. In locale questo vuoto
viene colmato con `dotnet user-secrets set` (vedi [Setup di sviluppo](development.md));
in un container viene colmato con variabili d'ambiente, usando `__` come separatore
di sezione (`ConnectionStrings__SchulyDatabase`).

## Stringa di connessione al database

`SchulyDbContext` legge la stringa di connessione denominata **`SchulyDatabase`**
(`ConnectionStrings:SchulyDatabase`), cablata in `DatabaseExtensions`. Il retry
automatico in caso di errore è abilitato per gli errori transitori di Postgres.

Forniscila tramite configurazione o una variabile d'ambiente, ad es.:

```sh
export ConnectionStrings__SchulyDatabase="Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=..."
```

## Autenticazione OIDC

L'autenticazione JWT bearer convalida i token rispetto all'authority OIDC
configurata (`AddSchulyAuthentication`):

| Chiave | Scopo |
|---|---|
| `Oidc:Authority` | Authority OIDC (Keycloak) usata per convalidare i bearer token. |
| `Oidc:RequireHttpsMetadata` | Se i metadati HTTPS sono richiesti (predefinito `true`). |

Mappatura dei claim del token:

- `name` → nome visualizzato (`NameClaimType`).
- **il claim `groups` → ruolo** (`RoleClaimType`). I valori dei gruppi vengono
  mappati sui ruoli applicativi **`Student`**, **`Teacher`** e **`Administrator`**.
- La convalida dell'audience è disabilitata (`ValidateAudience = false`).

Al primo token valido per un utente sconosciuto, l'API sincronizza l'utente a
partire dal token (`AddUserSync` / `IUserService`).

### Autenticazione di sviluppo (DevAuth)

In ambiente Development puoi abilitare un percorso locale di finto-OIDC al posto
di un IdP reale. Con `DevAuth:Enabled = true` (vedi `appsettings.Development.json`),
l'API si fida dei token generati da `/api/dev/token`, firmati con una chiave
simmetrica, usando `DevAuth:Issuer` (predefinito `schuly-dev`). Nessun identity
provider esterno viene contattato. **Non abilitare DevAuth in produzione.**

## Documento OpenAPI

`Oidc:Authority` viene letto anche quando il documento OpenAPI viene generato, per
pubblicizzare il flusso OAuth2 authorization-code. È richiesto anche quando
`DevAuth` sostituisce l'identity provider reale: senza di esso `/openapi/v1.json`
restituisce **500** (`Oidc:Authority not configured`) e la UI Scalar risulta vuota,
dato che la renderizza a partire da quel documento. `Oidc:ClientId` precompila il
client id nella finestra di autorizzazione della UI di riferimento.

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

Il database conserva solo una chiave blob nuda; un URL di capability firmato viene
generato a ogni accesso. La chiave viene letta in modo lazy, quindi un valore
mancante emerge come `Avatar:SigningKey is not configured.` alla prima firma di un
URL avatar, non all'avvio.

## Policy di autorizzazione

La policy predefinita (di fallback) **richiede un utente autenticato per ogni
endpoint** (`AddSchulyAuthorization`). Gli endpoint possono escludersi con
`[AllowAnonymous]`. La superficie anonima `/api/app` (ad es. il catalogo dei
sistemi scolastici e gli asset statici dei loghi sotto `wwwroot`) è raggiungibile
senza autenticazione, così che l'app possa caricare il proprio catalogo di login.
Gli endpoint di amministrazione dei plugin sotto `/api/plugins` richiedono il ruolo
`Administrator`.

## Plugin

La configurazione dell'host dei plugin (URL del registro, file dei plugin
desiderati, directory) è descritta in [Gestione dei plugin](../plugin-management.md).

## Logging

I livelli di logging sono impostati sotto `Logging:LogLevel` in `appsettings.json`.
L'override di Development eleva il logging HTTP a `Information` per il tracing
delle richieste.
