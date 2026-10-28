# Konfiguration

Die Konfiguration stammt aus `appsettings.json`, umgebungsspezifischen
Overrides (`appsettings.Development.json`), User Secrets und Umgebungsvariablen,
in der üblichen ASP.NET-Core-Rangfolge (Umgebungsvariablen überschreiben User
Secrets, diese überschreiben `appsettings.{Environment}.json`, welches wiederum
`appsettings.json` überschreibt).

Secrets werden bewusst **nicht** eingecheckt: Die versionierten
`appsettings*.json` enthalten nur Logging-Level und `DevAuth`. Lokal wird diese
Lücke mit `dotnet user-secrets set` gefüllt (siehe
[Entwicklungs-Setup](development.md)); in einem Container mit
Umgebungsvariablen, wobei `__` als Abschnittstrenner dient
(`ConnectionStrings__SchulyDatabase`).

## Datenbank-Connection-String

Der `SchulyDbContext` liest den Connection-String namens **`SchulyDatabase`**
(`ConnectionStrings:SchulyDatabase`), verdrahtet in `DatabaseExtensions`.
Retry-on-Failure ist für transiente Postgres-Fehler aktiviert.

Ihn über die Konfiguration oder eine Umgebungsvariable bereitstellen, z. B.:

```sh
export ConnectionStrings__SchulyDatabase="Host=localhost;Port=2406;Database=schuly-dev;Username=postgres;Password=..."
```

## OIDC-Authentifizierung

Die JWT-Bearer-Authentifizierung validiert Tokens gegen die konfigurierte
OIDC-Authority (`AddSchulyAuthentication`):

| Key | Zweck |
|---|---|
| `Oidc:Authority` | OIDC-Authority (Keycloak), gegen die Bearer-Tokens validiert werden. |
| `Oidc:RequireHttpsMetadata` | Ob HTTPS-Metadaten erforderlich sind (Standard `true`). |

Mapping der Token-Claims:

- `name` → Anzeigename (`NameClaimType`).
- **Claim `groups` → Rolle** (`RoleClaimType`). Gruppenwerte werden auf die
  Anwendungsrollen **`Student`**, **`Teacher`** und **`Administrator`**
  abgebildet.
- Die Audience-Validierung ist deaktiviert (`ValidateAudience = false`).

Beim ersten gültigen Token für einen unbekannten Benutzer synchronisiert die API
den Benutzer aus dem Token (`AddUserSync` / `IUserService`).

### Entwicklungs-Auth (DevAuth)

In Development lässt sich statt eines echten IdP ein lokaler Fake-OIDC-Pfad
aktivieren. Mit `DevAuth:Enabled = true` (siehe
`appsettings.Development.json`) vertraut die API Tokens, die von
`/api/dev/token` ausgestellt und mit einem symmetrischen Schlüssel signiert
werden, unter Verwendung von `DevAuth:Issuer` (Standard `schuly-dev`). Es wird
kein externer Identity Provider kontaktiert. **DevAuth in der Produktion nicht
aktivieren.**

## OpenAPI-Dokument

`Oidc:Authority` wird auch beim Generieren des OpenAPI-Dokuments gelesen, um den
OAuth2-Authorization-Code-Flow anzukündigen. Das ist selbst dann erforderlich,
wenn `DevAuth` den echten Identity Provider ersetzt: Ohne diesen Wert liefert
`/openapi/v1.json` **500** (`Oidc:Authority not configured`) und die Scalar-UI
bleibt leer, da sie genau dieses Dokument rendert. `Oidc:ClientId` befüllt die
Client-ID im Autorisierungsdialog der Referenz-UI vor.

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

Die Datenbank speichert nur einen blossen Blob-Key; pro Zugriff wird eine
signierte Capability-URL ausgestellt. Der Schlüssel wird lazy gelesen, sodass
ein fehlender Wert erst beim ersten Signieren einer Avatar-URL als
`Avatar:SigningKey is not configured.` auffällt, nicht schon beim Start.

## Autorisierungsrichtlinie

Die Standard- (Fallback-)Richtlinie **verlangt für jeden Endpunkt einen
authentifizierten Benutzer** (`AddSchulyAuthorization`). Endpunkte können sich
mit `[AllowAnonymous]` davon befreien. Die anonyme `/api/app`-Oberfläche (z. B.
der School-Systems-Katalog und statische Logo-Assets unter `wwwroot`) ist ohne
Auth erreichbar, damit die App ihren Login-Katalog laden kann. Admin-Endpunkte
für Plugins unter `/api/plugins` erfordern die Rolle `Administrator`.

## Plugins

Die Konfiguration des Plugin-Hosts (Registry-URL, Datei mit gewünschtem
Plugin-Bestand, Verzeichnisse) ist unter
[Plugin-Verwaltung](../plugin-management.md) beschrieben.

## Logging

Log-Level werden unter `Logging:LogLevel` in `appsettings.json` gesetzt. Der
Development-Override hebt das HTTP-Logging für Request-Tracing auf
`Information` an.
