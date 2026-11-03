# Konfiguration

Auf dieser Seite schlägst du die Einstellungen des Servers nach. Einstellungen kommen aus diesen Quellen, und jede
überschreibt die nachfolgenden:

1. Umgebungsvariablen
2. User Secrets
3. `appsettings.{Environment}.json`
4. `appsettings.json`

Die versionierten `appsettings*.json`-Dateien enthalten nur Log-Levels und nicht geheime Standardwerte, zum Beispiel den
Anmelde-Issuer und die lokalen Mail-Einstellungen. Setze Secrets anderswo:

- **Lokal:** Nutze `dotnet user-secrets set`. Siehe [Entwicklungsumgebung](development.md).
- **In einem Container:** Nutze Umgebungsvariablen, mit `__` als Abschnittstrenner, zum Beispiel
  `ConnectionStrings__SchulyDatabase`.

## Datenbank-Connection-String

`SchulyDbContext` liest den Connection-String namens `SchulyDatabase` (`ConnectionStrings:SchulyDatabase`), verdrahtet in
`DatabaseExtensions`. Wiederholungen bei vorübergehenden Postgres-Fehlern sind aktiv.

```sh
export ConnectionStrings__SchulyDatabase="Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=..."
```

## Anmeldung {#sign-in}

Die Anmeldung ist mit der Bibliothek [Toamaisutaa](https://www.nuget.org/packages/Toamaisutaa.AspNetCore)
(`AddSchulyAuthentication`) in den Server eingebaut. Es gibt keinen separaten Identity Provider. Ihre Tabellen liegen in
der Schuly-Datenbank (Migration `AddToamaisutaa`).

**Aktiviert:** Passwort-Anmeldung mit Selbstregistrierung, E-Mail-Verifizierung, Zurücksetzen des Passworts per E-Mail,
TOTP-Zwei-Faktor mit Wiederherstellungscodes, «remember this device» (vertrauenswürdige Geräte), optionales Single Sign-on
über OIDC-Provider und das Aufräumen abgelaufener Tokens.

**Nicht aktiviert:** Passkeys, Magic Links, Einladungen und von Admins erstellte Konten.

**Endpunkte:** Diese liegen unter `/auth`, zum Beispiel `POST /auth/register`, `/auth/login`, `/auth/refresh`,
`/auth/logout`, `/auth/password`, `/auth/password/forgot`, `/auth/password/reset`, `/auth/email`,
`/auth/email/verify`, `/auth/2fa/*`, `/auth/devices`, `/auth/providers` und `/auth/external/*`.

**Tokens:** Die API unter `/api/*` nimmt das Access-Token als `Authorization: Bearer`. Access-Tokens gelten 15 Minuten.
Refresh-Tokens rotieren bei jeder Nutzung.

**Clients:** Die Web-App, die der Server selbst ausliefert, sendet den Header `X-Schuly-Client: web`. Sie erhält das
Refresh-Token und das Token des gemerkten Geräts in `HttpOnly`-, `SameSite=Strict`-Cookies, beschränkt auf `/auth`. Andere
Clients, zum Beispiel die Mobile App, erhalten die Tokens im JSON-Body.

| Schlüssel | Zweck |
|---|---|
| `LocalLogin:SigningKey` | Signiert Access-Tokens. Base64, genau 32 Bytes. |
| `TwoFactor:EncryptionKey` | Verschlüsselt die Zwei-Faktor-Secrets. Base64, genau 32 Bytes. |
| `LocalLogin:Issuer`, `LocalLogin:Audience` | Token-Issuer und -Audience. `appsettings.json` setzt beide auf `schuly`. |
| `LocalLogin:AllowSelfRegistration` | Ob sich alle registrieren können (`true` in `appsettings.json`). |
| `LocalLogin:RequireVerifiedEmailForSignIn` | Ob die Anmeldung eine verifizierte Adresse braucht (`true` in `appsettings.json`). |
| `LocalLogin:RequireVerifiedEmailForPasswordReset` | Sendet Reset-Mails nur an verifizierte Adressen (`true` in `appsettings.json`). |
| `TwoFactor:Issuer` | Name in Authenticator-Apps (`Schuly`). |

Erzeuge beide Schlüssel mit `openssl rand -base64 32` und halte sie stabil. Ein neuer Signaturschlüssel meldet alle ab. Ein
neuer Verschlüsselungsschlüssel macht Zwei-Faktor für jedes Konto kaputt, das es eingerichtet hat.

Es gibt keine Admin-Rolle. Beim ersten gültigen Token eines unbekannten Users erstellt die API den passenden Schuly-User
(`AddUserSync`, `IUserService`).

### Single Sign-on (OIDC-Provider) {#single-sign-on-oidc-providers}

Single Sign-on ist optional. Konfiguriere keinen, einen oder mehrere OIDC-Provider: Google, Microsoft, Authentik, Pocket ID,
Keycloak oder jeden Issuer mit einem Discovery-Dokument. Ohne Provider zeigen die Web-App und die Mobile App nur das
Passwortformular. Jeder Provider erscheint als Button «Continue with ...». Angemeldete User verknüpfen oder trennen Provider
in der Web-App unter **Settings → Security**.

| Schlüssel | Zweck |
|---|---|
| `ExternalLogin:Providers:<key>:DisplayName` | Button-Beschriftung. Standardwert ist der Schlüssel. |
| `ExternalLogin:Providers:<key>:IconUrl` | Button-Icon: eine beliebige Bild-URL oder ein Pfad, den der Server ausliefert. Wenn leer, erhalten die Authorities von Google (`https://accounts.google.com`) und Microsoft (`login.microsoftonline.com`, `login.live.com`) ihr Logo. |
| `ExternalLogin:Providers:<key>:Authority` | Der Issuer, zum Beispiel `https://accounts.google.com`. Muss ausserhalb von Development `https://` sein. |
| `ExternalLogin:Providers:<key>:ClientId`, `ClientSecret` | Der Client, den der Provider ausgestellt hat. Lass das Secret bei einem öffentlichen Client weg. |
| `ExternalLogin:Providers:<key>:Scopes` | Standardwert ist `openid profile email`. |
| `ExternalLogin:Providers:<key>:AllowSignUp` | Ob eine erste Anmeldung ein Konto erstellen darf. Standardmässig `false`, damit nur Konten mit verknüpftem Provider ihn nutzen können. |
| `ExternalLogin:Providers:<key>:TrustEmailVerified` | Ob eine Adresse, die dieser Provider als `email_verified` markiert, als E-Mail des Kontos gilt, wenn das Konto keine verifizierte Adresse hat. Ohne das haben über den Provider erstellte Konten keine E-Mail. Schalte das nur bei Providern ein, die Adressen wirklich verifizieren. |
| `ExternalLogin:Providers:<key>:LinkByVerifiedEmail` | Ob eine erste Anmeldung dem Konto beitritt, das schon die verifizierte Adresse des Providers hat. Schalte das nur bei Providern ein, die Adressen wirklich verifizieren. |
| `ExternalLogin:AllowedReturnUrls` | Exakte URLs, zu denen eine abgeschlossene Anmeldung zurückkehren darf (`ExternalLogin__AllowedReturnUrls__0`, `__1` und so weiter). |
| `ExternalLogin:CallbackBaseUrl` | Öffentliches Schema und öffentlicher Host des Servers, wenn ein Proxy sie nicht weiterleitet. |

`AllowedReturnUrls` braucht diese Einträge:

- `https://<API_HOST>/login`: Anmeldung in der Web-App
- `https://<API_HOST>/settings`: Provider in der Web-App verknüpfen
- `schuly://auth/callback`: Anmeldung in der Mobile App (`schuly-dev://auth/callback` für den Dev-Build)

Registriere bei jedem Provider `https://<API_HOST>/auth/external/<key>/callback` als Redirect-URI. Jede Verknüpfung speichert
den Schlüssel. Benenne ihn deshalb später nicht um.

### E-Mail (SMTP)

Verifizierungs- und Reset-Mails gehen über SMTP hinaus:

| Schlüssel | Zweck |
|---|---|
| `Email:Smtp:Host`, `Email:Smtp:Port` | Mailserver. |
| `Email:Smtp:Security` | Verbindungssicherheit. `appsettings.Development.json` setzt `None`. |
| `Email:Smtp:User`, `Email:Smtp:Password` | Zugangsdaten des Mailservers. |
| `Email:Smtp:From` | Absenderadresse. |
| `Email:Smtp:FromDisplayName` | Absendername (`Schuly` in `appsettings.json`). |
| `Email:Smtp:PasswordResetLinkTemplate` | Link in der Reset-Mail, zum Beispiel `https://<API_HOST>/reset-password?token={token}`. |
| `Email:Smtp:EmailVerificationLinkTemplate` | Link in der Verifizierungs-Mail, zum Beispiel `https://<API_HOST>/verify-email?token={token}`. |

In Development sendet `appsettings.Development.json` Mails an einen lokalen SMTP-Catcher auf `localhost:1025` und baut Links
auf `http://localhost:4200`. Siehe [Entwicklungsumgebung](development.md).

## OpenAPI-Dokument

Das OpenAPI-Dokument nutzt ein HTTP-Bearer-Sicherheitsschema. Im Scalar-UI fügst du ein Access-Token ein. Es gibt keinen
OAuth2-Ablauf.

## Dokumenten-Storage (S3) {#document-storage-s3}

Dokument- und Avatar-Blobs gehen in einen S3-kompatiblen Bucket, in den mitgelieferten Stacks ist das SeaweedFS.

| Schlüssel | Zweck |
|---|---|
| `S3:Endpoint` | S3-Endpunkt, zum Beispiel `http://localhost:8333`. |
| `S3:Bucket` | Bucket-Name. |
| `S3:AccessKey`, `S3:SecretKey` | Zugangsdaten. Müssen zur `s3-config.json` von SeaweedFS passen. |
| `S3:UsePathStyle` | Standardmässig `true`. Nutze `true` für SeaweedFS und die meisten selbst gehosteten S3-Implementierungen. |
| `Documents:EncryptionKey` | Verschlüsselt Dokumente, bevor sie den Bucket erreichen. Erzeuge ihn mit `openssl rand -base64 32`. Ausserhalb von Development erforderlich. Geht er verloren, sind gespeicherte Dokumente nicht mehr lesbar. |
| `Documents:KeyVersion`, `Documents:PreviousKeys:<version>` | Aktuelle Schlüsselversion (Standard `1`) und frühere Schlüssel, damit damit verschlüsselte Dokumente lesbar bleiben. |

## Avatar-URL-Signierung {#avatar-url-signing}

| Schlüssel | Zweck |
|---|---|
| `Avatar:SigningKey` | HMAC-Schlüssel für kurzlebige signierte Avatar-URLs. Erzeuge ihn mit `openssl rand -hex 32`. |

User laden ein Profilbild mit `PUT /api/me/avatar` hoch (multipart; PNG, JPEG oder WebP; höchstens 2 MB) und entfernen es mit
`DELETE /api/me/avatar`. Die Datei geht in den Dokumenten-Storage und wird über kurzlebige signierte URLs unter
`/api/avatars/users/{id}` ausgeliefert.

Die Datenbank speichert nur einen reinen Blob-Schlüssel, und der Server erstellt für jeden Zugriff eine signierte URL. Der
Server liest den Schlüssel erst bei Bedarf. Fehlt er, siehst du `Avatar:SigningKey is not configured.`, wenn zum ersten Mal
eine Avatar-URL signiert wird, nicht beim Start.

## Plugin-Vault

| Schlüssel | Zweck |
|---|---|
| `Vault:MasterKey` | Verschlüsselt gespeicherte Plugin-Zugangsdaten. Base64, genau 32 Bytes. Erzeuge ihn mit `openssl rand -base64 32`. |

Ausserhalb von Development startet der Server nicht ohne gültigen Schlüssel. Halte den Schlüssel stabil: Unter einem neuen
Schlüssel werden gespeicherte Zugangsdaten unlesbar. In Development führt ein fehlender oder ungültiger Schlüssel zu einer
Warnung im Log, und der Server nutzt einen temporären Schlüssel. Gespeicherte Zugangsdaten überstehen dann keinen Neustart.

## Aufbewahrung

Ein Hosted Service räumt abgelaufene Daten fünf Minuten nach dem Start und danach alle 24 Stunden auf. Er nutzt denselben
Löschcode wie `DELETE /api/auth/me`. Eine aufgeräumte Zeile hinterlässt also nichts in Postgres oder S3.

| Schlüssel | Zweck |
|---|---|
| `Retention:Enabled` | Ob das Aufräumen überhaupt läuft (Standard `true`). |
| `Retention:MonthsAfterLeave` | Entfernt zwischengespeicherte Schuldaten von School-Usern, deren `LeaveDate` älter ist als dieser Wert (Standard `6`). |
| `Retention:MonthsInactive` | Löscht die Schuly-Daten von Konten ohne authentifizierte Anfrage in dieser Zeit, nicht das Anmeldekonto (Standard `12`). |

`ApplicationUser.LastSeenAt` misst die Inaktivität. Die JWT-Validierungs-Pipeline stempelt den Wert höchstens einmal pro
Stunde, damit ein aktiver Client nicht bei jeder Anfrage schreibt. Ein Konto ohne Stempel fällt auf sein `CreatedAt` zurück.

Das Anmeldekonto bleibt. Ein aufgeräumtes Konto kann sich also wieder anmelden und von Grund auf neu synchronisieren.

## Push-Benachrichtigungen (Firebase) {#push-notifications-firebase}

Ein Hintergrund-Service leert die Benachrichtigungs-Outbox (Noten, Absenzen, Agenda-Änderungen) und stellt sie über Firebase
Cloud Messaging zu.

| Schlüssel | Zweck |
|---|---|
| `Firebase:ServiceAccountJson` | Base64 des Firebase-Service-Account-JSON. |
| `Firebase:ServiceAccountPath` | Pfad zur Service-Account-JSON-Datei, als Alternative zum Inline-Wert. |

Ist keiner der beiden gesetzt, loggt das Backend beim Start einmal, dass Push-Benachrichtigungen aus sind, und sendet nichts.
Deployments ohne Firebase funktionieren also weiter. Es leert die Outbox trotzdem, damit die Tabelle begrenzt bleibt.

## Helply {#helply}

Helply ist der optionale KI-Assistent. Er braucht ein OpenAI-kompatibles Chat-Completions-Gateway.

| Schlüssel | Zweck |
|---|---|
| `Helply:BaseUrl` | Gateway-URL. Absolut, `http` oder `https`. |
| `Helply:ApiKey` | API-Key des Gateways. |
| `Helply:Model` | Optional. Ohne den Wert prüft der Server die Modelle, die das Gateway auflistet, und nutzt das erste, das auf Tool-Aufrufe antwortet. |

`BaseUrl` und `ApiKey` schalten Helply zusammen ein. Diese drei Einstellungen haben keinen Standardwert. Setze sie nur als
Umgebungsvariablen (`Helply__BaseUrl`, `Helply__ApiKey`, `Helply__Model`), nie in appsettings. Ohne sie loggt der Server, dass
Helply deaktiviert ist, und User sehen es als ausgeschaltet.

### Limits

Diese Schlüssel liegen unter `Helply:Limits`.

| Schlüssel | Standard | Zweck |
|---|---|---|
| `MessagesPerMinute` | `10` | Nachrichten pro User und Minute. |
| `MessagesPerDay` | `200` | Nachrichten pro User und Tag. |
| `MaxInputChars` | `4000` | Längste Nachricht. |
| `RunTimeoutSeconds` | `120` | Zeitbudget für einen Durchgang. |
| `RunTimeoutSecondsWithWorkspace` | `300` | Zeitbudget für einen Durchgang mit dem Workspace. |
| `MaxToolIterations` | `8` | Tool-Runden in einem Durchgang. |
| `MaxToolIterationsWithWorkspace` | `16` | Tool-Runden in einem Durchgang mit dem Workspace. |
| `MaxHistoryMessages` | `40` | Frühere Nachrichten, die an das Modell gehen. |
| `MaxHistoryChars` | `60000` | Früherer Text, der an das Modell geht. |
| `MaxOutputTokens` | `2048` | Längste Antwort. |
| `MaxToolResultChars` | `16000` | Längstes Tool-Ergebnis im Prompt. Längere Ergebnisse werden mit einem Hinweis gekürzt. |
| `MaxToolArgumentChars` | `20000` | Längste serialisierte Tool-Argumente. Grössere Aufrufe werden abgelehnt. |
| `MaxAttachmentTextChars` | `30000` | Höchstmenge Text aus einem Anhang im Prompt. |
| `MaxAttachmentTextTotalChars` | `60000` | Höchstmenge Anhangstext in einer Modell-Anfrage. |
| `MaxNativeBytesPerRequest` | `12000000` | Höchstmenge Datei-Bytes (Bilder, PDFs), die in einer Modell-Anfrage als Dateien gesendet werden. |

### Workspace

Mit dem Workspace kann Helply Code in einer Sandbox ausführen. Er braucht `Helply:Sandbox:BaseUrl` und
`Helply:Sandbox:ApiKey`, der mindestens 32 Zeichen haben muss. Setze sie als Umgebungsvariablen (`Helply__Sandbox__BaseUrl`,
`Helply__Sandbox__ApiKey`). Die Einrichtung steht im
[Deploy-README](https://github.com/schulydev/SchulyServer/blob/main/deploy/README.md).

## MCP-Server {#mcp-server}

Der Server stellt MCP unter `/mcp` bereit, damit User KI-Apps verbinden können.

| Schlüssel | Zweck |
|---|---|
| `Mcp:PublicUrl` | Der öffentliche Origin und die Audience jedes MCP-Tokens. Setze ihn in Deployments. Ohne ihn nimmt der Server den Origin aus jeder Anfrage. |
| `Mcp:AllowedOrigins` | Browser-Origins, die CORS nutzen dürfen, neben dem eigenen des Servers (`Mcp__AllowedOrigins__0`, `__1` und so weiter). Wildcards werden nicht unterstützt. |

Das sind die einzigen zwei Einstellungen, die du konfigurieren musst.

## Autorisierungsrichtlinie

Die Fallback-Richtlinie verlangt für jeden Endpunkt einen authentifizierten User (`AddSchulyAuthorization`). Endpunkte
nehmen sich mit `[AllowAnonymous]` aus. Diese brauchen kein Token:

- Die anonyme `/api/app`-Oberfläche, zum Beispiel der Schulsystem-Katalog und die statischen Logo-Dateien unter `wwwroot`,
  damit die App ihren Login-Katalog laden kann.
- Registrierung, Login und die anderen öffentlichen Anmelde-Endpunkte unter `/auth`.

## Plugins

Die Registry-URL, die Datei mit den gewünschten Plugins und die Verzeichnisse findest du unter
[Plugin-Verwaltung](../plugin-management.md).

## Logging

Setze Log-Levels unter `Logging:LogLevel` in `appsettings.json`. Das Development-Override erhöht das HTTP-Logging für das
Nachverfolgen von Anfragen auf `Information`.
