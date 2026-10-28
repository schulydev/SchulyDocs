# Konfiguration

Die Konfiguration stammt aus `appsettings.json`, umgebungsspezifischen
Overrides (`appsettings.Development.json`), User Secrets und Umgebungsvariablen,
in der üblichen ASP.NET-Core-Rangfolge (Umgebungsvariablen überschreiben User
Secrets, diese überschreiben `appsettings.{Environment}.json`, welches wiederum
`appsettings.json` überschreibt).

Secrets werden bewusst **nicht** eingecheckt: Die versionierten
`appsettings*.json` enthalten nur Logging-Level und nicht geheime Standardwerte
(Issuer für die Anmeldung, lokale Mail-Einstellungen). Lokal wird diese Lücke mit
`dotnet user-secrets set` gefüllt (siehe [Entwicklungs-Setup](development.md)); in
einem Container mit Umgebungsvariablen, wobei `__` als Abschnittstrenner dient
(`ConnectionStrings__SchulyDatabase`).

## Datenbank-Connection-String

Der `SchulyDbContext` liest den Connection-String namens **`SchulyDatabase`**
(`ConnectionStrings:SchulyDatabase`), verdrahtet in `DatabaseExtensions`.
Retry-on-Failure ist für transiente Postgres-Fehler aktiviert.

Ihn über die Konfiguration oder eine Umgebungsvariable bereitstellen, z. B.:

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
Wiederherstellungscodes, "Dieses Gerät merken" (vertrauenswürdige Geräte) und das
Aufräumen abgelaufener Tokens. Passkeys, Magic Links, Einladungen, von Admins
angelegte Konten und externe OIDC-Provider sind nicht aktiviert.

Die Endpunkte liegen unter `/auth`, zum Beispiel `POST /auth/register`,
`/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/password`,
`/auth/password/forgot`, `/auth/password/reset`, `/auth/email`,
`/auth/email/verify`, `/auth/2fa/*` und `/auth/devices`. Die API unter `/api/*`
nimmt das Access-Token als `Authorization: Bearer` entgegen. Access-Tokens leben 15
Minuten. Refresh-Tokens werden bei jeder Verwendung rotiert.

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
| `Auth:Administrators` | Liste von E-Mail-Adressen oder Benutzernamen, die die Rolle `Administrator` erhalten (`Auth__Administrators__0`, `__1`, ...). |

Beide Schlüssel mit `openssl rand -base64 32` erzeugen und stabil halten. Ein neuer
Signierschlüssel meldet alle ab. Ein neuer Verschlüsselungsschlüssel macht
Zwei-Faktor für jedes Konto unbrauchbar, das es eingerichtet hat.

Jedes Konto, das nicht in `Auth:Administrators` steht, hat keine Rolle. Beim ersten
gültigen Token für einen unbekannten Benutzer legt die API den passenden
Schuly-Benutzer an (`AddUserSync` / `IUserService`).

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
| `Avatar:SigningKey` | HMAC-Schlüssel für kurzlebige, signierte Avatar-URLs. Erzeugen mit `openssl rand -hex 32`. |

Benutzer laden ein Profilbild mit `PUT /api/me/avatar` hoch (multipart, PNG, JPEG
oder WebP, max. 2 MB) und entfernen es mit `DELETE /api/me/avatar`. Die Datei geht
in den Dokumenten-Storage (S3) und wird über kurzlebige, signierte URLs unter
`/api/avatars/users/{id}` ausgeliefert.

Die Datenbank speichert nur einen blossen Blob-Key; pro Zugriff wird eine
signierte Capability-URL ausgestellt. Der Schlüssel wird lazy gelesen, sodass
ein fehlender Wert erst beim ersten Signieren einer Avatar-URL als
`Avatar:SigningKey is not configured.` auffällt, nicht schon beim Start.

## Aufbewahrung

Ein Hosted Service räumt abgelaufene Daten einmal täglich auf, fünf Minuten nach dem
Start und danach alle 24 Stunden. Er verwendet denselben Löschcode wie
`DELETE /api/auth/me`, sodass eine aufgeräumte Zeile nichts in Postgres oder S3
zurücklässt.

| Key | Zweck |
|---|---|
| `Retention:Enabled` | Ob das Aufräumen überhaupt läuft (Standard `true`). |
| `Retention:MonthsAfterLeave` | Zwischengespeicherte Schuldaten werden für Schulbenutzer gelöscht, deren `LeaveDate` älter ist als dieser Wert (Standard `6`). |
| `Retention:MonthsInactive` | Konten ohne authentifizierten Request in diesem Zeitraum werden gelöscht (Standard `12`). |

"Inaktiv" wird über `ApplicationUser.LastSeenAt` gemessen. Der Wert wird in der
JWT-Validierungs-Pipeline höchstens einmal pro Stunde gesetzt, damit ein aktiver
Client nicht bei jedem Request schreibt. Ein Konto, bei dem er nie gesetzt wurde,
fällt auf sein `CreatedAt` zurück.

Das Aufräumen löscht nur die Schuly-Daten, nicht das Anmeldekonto. Ein wegen
Inaktivität aufgeräumtes Konto kann sich also wieder anmelden und von Grund auf neu
synchronisieren.

## Push-Benachrichtigungen (Firebase)

Die Outbox für Benachrichtigungen (Noten, Absenzen, Agenda-Änderungen) wird von
einem Background-Service geleert und über Firebase Cloud Messaging zugestellt.

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
authentifizierten Benutzer** (`AddSchulyAuthorization`). Endpunkte können sich
mit `[AllowAnonymous]` davon befreien. Die anonyme `/api/app`-Oberfläche (z. B.
der School-Systems-Katalog und statische Logo-Assets unter `wwwroot`) ist ohne
Auth erreichbar, damit die App ihren Login-Katalog laden kann. Registrierung,
Login und die anderen öffentlichen Anmelde-Endpunkte unter `/auth` brauchen
ebenfalls kein Token. Admin-Endpunkte für Plugins unter `/api/plugins` erfordern
die Rolle `Administrator`.

## Plugins

Die Konfiguration des Plugin-Hosts (Registry-URL, Datei mit gewünschtem
Plugin-Bestand, Verzeichnisse) ist unter
[Plugin-Verwaltung](../plugin-management.md) beschrieben.

## Logging

Log-Level werden unter `Logging:LogLevel` in `appsettings.json` gesetzt. Der
Development-Override hebt das HTTP-Logging für Request-Tracing auf
`Information` an.
