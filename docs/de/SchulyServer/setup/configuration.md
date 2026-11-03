# Konfiguration

Die Konfiguration stammt aus `appsettings.json`, umgebungsspezifischen
Overrides (`appsettings.Development.json`), User Secrets und Umgebungsvariablen,
in der üblichen ASP.NET-Core-Rangfolge (Umgebungsvariablen überschreiben User
Secrets, diese überschreiben `appsettings.{Environment}.json`, welches wiederum
`appsettings.json` überschreibt).

Secrets sind bewusst **nicht** eingecheckt: Die versionierten
`appsettings*.json` enthalten nur Logging-Level und nicht geheime Standardwerte
(Issuer für die Anmeldung, lokale Mail-Einstellungen). Lokal füllt
`dotnet user-secrets set` diese Lücke (siehe [Entwicklungs-Setup](development.md));
in einem Container füllen sie Umgebungsvariablen, mit `__` als Abschnittstrenner
(`ConnectionStrings__SchulyDatabase`).

## Datenbank-Connection-String

Der `SchulyDbContext` liest den Connection-String namens **`SchulyDatabase`**
(`ConnectionStrings:SchulyDatabase`), verdrahtet in `DatabaseExtensions`.
Retry-on-Failure ist für transiente Postgres-Fehler aktiviert.

Stelle ihn über die Konfiguration oder eine Umgebungsvariable bereit, z. B.:

```sh
export ConnectionStrings__SchulyDatabase="Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=..."
```

## Anmeldung

Die Anmeldung ist mit der Bibliothek
[Toamaisutaa](https://www.nuget.org/packages/Toamaisutaa.AspNetCore) in den Server
eingebaut (`AddSchulyAuthentication`). Es gibt keinen separaten Identity Provider.
Ihre Tabellen liegen in der Schuly-Datenbank (Migration `AddToamaisutaa`).

Aktivierte Funktionen: Anmeldung mit Passwort und Selbstregistrierung,
E-Mail-Verifizierung, Zurücksetzen des Passworts per E-Mail, TOTP-Zwei-Faktor mit
Wiederherstellungscodes, "Dieses Gerät merken" (vertrauenswürdige Geräte), optionales
Single Sign-on über OIDC-Provider und das Aufräumen abgelaufener Tokens. Passkeys,
Magic Links, Einladungen und von Admins angelegte Konten sind nicht aktiviert.

Die Endpunkte liegen unter `/auth`, zum Beispiel `POST /auth/register`,
`/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/password`,
`/auth/password/forgot`, `/auth/password/reset`, `/auth/email`,
`/auth/email/verify`, `/auth/2fa/*` und `/auth/devices`, `/auth/providers` und
`/auth/external/*`. Die API unter `/api/*` nimmt das Access-Token als
`Authorization: Bearer` entgegen. Access-Tokens leben 15 Minuten. Refresh-Tokens
rotieren bei jeder Verwendung.

Die Web-App (vom Server selbst ausgeliefert) sendet den Header
`X-Schuly-Client: web`. Sie erhält dann das Refresh-Token und das Token für das
gemerkte Gerät in `HttpOnly`-, `SameSite=Strict`-Cookies, die auf `/auth`
beschränkt sind. Andere Clients, etwa die Mobile-App, erhalten die Tokens im
JSON-Body.

| Key | Zweck |
|---|---|
| `LocalLogin:SigningKey` | Schlüssel, der Access-Tokens signiert. Base64, genau 32 Bytes. |
| `TwoFactor:EncryptionKey` | Schlüssel, der die Zwei-Faktor-Secrets verschlüsselt. Base64, genau 32 Bytes. |
| `LocalLogin:Issuer` / `LocalLogin:Audience` | Issuer und Audience der Tokens. `appsettings.json` setzt beide auf `schuly`. |
| `LocalLogin:AllowSelfRegistration` | Ob sich jeder registrieren kann (`true` in `appsettings.json`). |
| `LocalLogin:RequireVerifiedEmailForPasswordReset` | Reset-Mails nur an verifizierte Adressen senden (`true` in `appsettings.json`). |
| `TwoFactor:Issuer` | Name, der in Authenticator-Apps angezeigt wird (`Schuly`). |

Erzeuge beide Schlüssel mit `openssl rand -base64 32` und halte sie stabil. Ein neuer
Signierschlüssel meldet alle ab. Ein neuer Verschlüsselungsschlüssel macht
Zwei-Faktor für jedes Konto unbrauchbar, das es eingerichtet hat.

Es gibt keine Admin-Rolle. Beim ersten gültigen Token für einen unbekannten Benutzer
legt die API den passenden Schuly-Benutzer an (`AddUserSync` / `IUserService`).

### Single Sign-on (OIDC-Provider) {#single-sign-on-oidc-providers}

Single Sign-on ist optional. Konfiguriere keinen, einen oder mehrere OIDC-Provider
(Google, Microsoft, Authentik, Pocket ID, Keycloak, jeden Issuer mit einem
Discovery-Dokument). Ist keiner konfiguriert, zeigen die Web-App und die Mobile-App
nur das Passwortformular. Jeder Provider erscheint als Button "Continue with ...",
und angemeldete Benutzer verknüpfen oder trennen Provider in der Web-App unter
Settings → Security.

| Key | Zweck |
|---|---|
| `ExternalLogin:Providers:<key>:DisplayName` | Beschriftung des Buttons. Standardwert ist der Key. |
| `ExternalLogin:Providers:<key>:IconUrl` | Icon auf dem Button: eine beliebige Bild-URL oder ein Pfad, den der Server ausliefert. Authorities von Google (`https://accounts.google.com`) und Microsoft (`login.microsoftonline.com`, `login.live.com`) erhalten ihr Logo, wenn dieser Wert leer ist. |
| `ExternalLogin:Providers:<key>:Authority` | Der Issuer, z. B. `https://accounts.google.com`. Muss ausserhalb von Development `https://` sein. |
| `ExternalLogin:Providers:<key>:ClientId` / `ClientSecret` | Der Client, den der Provider ausgestellt hat. Lass das Secret bei einem Public Client weg. |
| `ExternalLogin:Providers:<key>:Scopes` | Standardwert ist `openid profile email`. |
| `ExternalLogin:Providers:<key>:AllowSignUp` | Ob eine erste Anmeldung ein neues Konto anlegen darf. Standardmässig `false`: Nur Konten, die den Provider verknüpft haben, können ihn verwenden. |
| `ExternalLogin:Providers:<key>:TrustEmailVerified` | Ob die Adresse, die dieser Provider als `email_verified` markiert, als E-Mail des Kontos gilt, wenn das Konto keine eigene verifizierte Adresse hat. Ohne diese Einstellung haben Konten, die über den Provider entstehen, keine E-Mail. Schalte sie nur für Provider ein, die Adressen wirklich verifizieren. |
| `ExternalLogin:Providers:<key>:LinkByVerifiedEmail` | Ob sich eine erste Anmeldung mit dem Konto verbindet, das die verifizierte Adresse des Providers bereits hat. Schalte diese Einstellung nur für Provider ein, die Adressen wirklich verifizieren. |
| `ExternalLogin:AllowedReturnUrls` | Exakte URLs, zu denen eine abgeschlossene Anmeldung zurückkehren darf (`ExternalLogin__AllowedReturnUrls__0`, `__1`, ...). |
| `ExternalLogin:CallbackBaseUrl` | Öffentliches Schema und öffentlicher Host des Servers, wenn ein Proxy sie nicht weiterleitet. |

`AllowedReturnUrls` braucht diese Einträge:

- `https://<API_HOST>/login`: Anmeldung in der Web-App
- `https://<API_HOST>/settings`: Provider in der Web-App verknüpfen
- `schuly://auth/callback`: Anmeldung in der Mobile-App (`schuly-dev://auth/callback` für den Dev-Build)

Registriere bei jedem Provider `https://<API_HOST>/auth/external/<key>/callback` als
Redirect-URI. Der Key wird mit jeder Verknüpfung gespeichert, benenne ihn also später
nicht um.

### E-Mail (SMTP)

Verifizierungs- und Passwort-Reset-Mails gehen über SMTP hinaus:

| Key | Zweck |
|---|---|
| `Email:Smtp:Host` / `Email:Smtp:Port` | Mailserver. |
| `Email:Smtp:User` / `Email:Smtp:Password` | Zugangsdaten für den Mailserver. |
| `Email:Smtp:From` | Absenderadresse. |
| `Email:Smtp:PasswordResetLinkTemplate` | Link in der Reset-Mail, z. B. `https://<API_HOST>/reset-password?token={token}`. |
| `Email:Smtp:EmailVerificationLinkTemplate` | Link in der Verifizierungs-Mail, z. B. `https://<API_HOST>/verify-email?token={token}`. |

In Development leitet `appsettings.Development.json` Mails an einen lokalen
SMTP-Catcher auf `localhost:1025` und baut Links zu `http://localhost:4200`. Siehe
[Entwicklungs-Setup](development.md).

## OpenAPI-Dokument

Das OpenAPI-Dokument verwendet ein HTTP-Bearer-Security-Scheme. In der Scalar-UI
fügst du ein Access-Token ein; es gibt keinen OAuth2-Flow.

## Dokumenten-Storage (S3)

Dokument- und Avatar-Blobs gehen in einen S3-kompatiblen Bucket (in den
mitgelieferten Stacks SeaweedFS), konfiguriert unter `S3:`:

| Key | Zweck |
|---|---|
| `S3:Endpoint` | S3-Endpoint, z. B. `http://localhost:8333`. |
| `S3:Bucket` | Name des Buckets. |
| `S3:AccessKey` / `S3:SecretKey` | Zugangsdaten. Müssen mit der SeaweedFS-Datei `s3-config.json` übereinstimmen. |
| `S3:UsePathStyle` | `true` für SeaweedFS und die meisten selbst gehosteten S3-Implementierungen. |

## Avatar-URL-Signierung

| Key | Zweck |
|---|---|
| `Avatar:SigningKey` | HMAC-Schlüssel für kurzlebige, signierte Avatar-URLs. Erzeuge ihn mit `openssl rand -hex 32`. |

Benutzer laden ein Profilbild mit `PUT /api/me/avatar` hoch (multipart, PNG, JPEG
oder WebP, max. 2 MB) und entfernen es mit `DELETE /api/me/avatar`. Die Datei geht
in den Dokumenten-Storage (S3). Der Server liefert sie über kurzlebige, signierte URLs
unter `/api/avatars/users/{id}` aus.

Die Datenbank speichert nur einen blossen Blob-Key; pro Zugriff entsteht eine
signierte Capability-URL. Der Schlüssel wird lazy gelesen, sodass ein fehlender Wert
erst beim ersten Signieren einer Avatar-URL als
`Avatar:SigningKey is not configured.` auffällt, nicht schon beim Start.

## Aufbewahrung

Ein Hosted Service räumt abgelaufene Daten einmal täglich auf, fünf Minuten nach dem
Start und danach alle 24 Stunden. Er verwendet denselben Löschcode wie
`DELETE /api/auth/me`, sodass eine aufgeräumte Zeile nichts in Postgres oder S3
zurücklässt.

| Key | Zweck |
|---|---|
| `Retention:Enabled` | Ob das Aufräumen überhaupt läuft (Standard `true`). |
| `Retention:MonthsAfterLeave` | Schuly löscht zwischengespeicherte Schuldaten von Schulbenutzern, deren `LeaveDate` älter ist als dieser Wert (Standard `6`). |
| `Retention:MonthsInactive` | Schuly löscht Konten ohne authentifizierten Request in diesem Zeitraum (Standard `12`). |

"Inaktiv" misst Schuly über `ApplicationUser.LastSeenAt`. Die
JWT-Validierungs-Pipeline setzt den Wert höchstens einmal pro Stunde, damit ein aktiver
Client nicht bei jedem Request schreibt. Ein Konto, bei dem er nie gesetzt wurde,
fällt auf sein `CreatedAt` zurück.

Das Aufräumen löscht nur die Schuly-Daten, nicht das Anmeldekonto. Ein wegen
Inaktivität aufgeräumtes Konto kann sich also wieder anmelden und von Grund auf neu
synchronisieren.

## Push-Benachrichtigungen (Firebase)

Ein Background-Service leert die Outbox für Benachrichtigungen (Noten, Absenzen,
Agenda-Änderungen) und stellt sie über Firebase Cloud Messaging zu.

| Key | Zweck |
|---|---|
| `Firebase:ServiceAccountJson` | Base64 des Firebase-Service-Account-JSON. |
| `Firebase:ServiceAccountPath` | Pfad zur Service-Account-JSON-Datei, als Alternative zum Inline-Wert. |

Ist keines von beiden gesetzt, protokolliert das Backend beim Start einmal, dass
Push-Benachrichtigungen deaktiviert sind, und tut danach nichts mehr. Deployments
ohne Firebase funktionieren so weiter. Die Outbox wird auch in diesem Fall geleert,
damit die Tabelle begrenzt bleibt, selbst wenn Push ausgeschaltet ist.

## Autorisierungsrichtlinie

Die Standard- (Fallback-)Richtlinie **verlangt für jeden Endpunkt einen
authentifizierten Benutzer** (`AddSchulyAuthorization`). Endpunkte befreien sich
mit `[AllowAnonymous]` davon. Die anonyme `/api/app`-Oberfläche (z. B.
der School-Systems-Katalog und statische Logo-Assets unter `wwwroot`) ist ohne
Auth erreichbar, damit die App ihren Login-Katalog laden kann. Registrierung,
Login und die anderen öffentlichen Anmelde-Endpunkte unter `/auth` brauchen
ebenfalls kein Token.

## Plugins

Die Konfiguration des Plugin-Hosts (Registry-URL, Datei mit gewünschtem
Plugin-Bestand, Verzeichnisse) ist unter
[Plugin-Verwaltung](../plugin-management.md) beschrieben.

## Logging

Log-Level werden unter `Logging:LogLevel` in `appsettings.json` gesetzt. Der
Development-Override hebt das HTTP-Logging für Request-Tracing auf
`Information` an.
