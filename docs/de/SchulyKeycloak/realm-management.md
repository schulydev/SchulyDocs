# Realm-Verwaltung

Das `schuly`-Realm ist in `realms/schuly-realm.json` definiert und wird **beim ersten
Start importiert** (`--import-realm`). Es enthält die Schuly-Identitätskonfiguration:
die Realm-Rollen `Student` / `Teacher` / `Administrator` mit den passenden Gruppen,
OIDC-Client-Scopes (`profile`, `email`, `groups`, `picture`), die Auswahl des
`schuly`-Login-Themes, einen 2FA-Browser-Flow, die Self-Service-Registrierung und
eine Passwort-Policy, die auf die rockyou-Sperrliste verweist
(`passwordBlacklist(rockyou.txt)`).

## Self-Registrierung

Die Selbstregistrierung von Nutzern ist **aktiviert** (`registrationAllowed`), die
Login-Seite zeigt also einen **Registrieren**-Link, und Besucher können sich selbst
einen Account anlegen. Das Formular wird über ein deklaratives User-Profil bewusst
schlank gehalten - nur **Benutzername, E-Mail und Passwort** (kein Vor-/Nachname).
Die E-Mail-Verifizierung ist standardmässig deaktiviert (es ist kein SMTP
vorkonfiguriert) - setze die `SMTP_*`-Variablen aus
[Konfiguration](configuration.md#smtp-realm-e-mail), wenn verifizierte E-Mails oder
die Self-Service-Passwort-Zurücksetzung tatsächlich zugestellt werden sollen.

## Zwei-Faktor-Authentifizierung

2FA ist **Passkey-first, aber optional**. Der Flow `browser-2fa` prüft zunächst
Benutzername + Passwort, dann folgt ein *bedingter* MFA-Schritt: Hat der Nutzer
bereits eine 2FA-Anmeldeinformation, wird er danach gefragt (Passkey oder OTP - je
nachdem, was er hat). Die Registrierung wird **angeboten, nicht erzwungen**:
`webauthn-register-passwordless` und `CONFIGURE_TOTP` sind aktiviert, aber **keine**
Default Actions - niemand wird also beim ersten Login durch eine verpflichtende
Registrierung blockiert.

Das ist wichtig für **vermittelte Logins (Brokered Logins)** über einen externen IdP
(z. B. Pocket ID): Diese Nutzer haben sich bereits an der Quelle mit einem Passkey
authentifiziert, ein erzwungener Passkey-Schritt in Keycloak wäre also redundant -
und da Keycloak Default Required Actions auch auf vermittelte Nutzer anwendet, würde
er sie sogar blockieren. Die Registrierung optional zu halten vermeidet genau das.

OTP / Authenticator-App (`CONFIGURE_TOTP`) und Passkeys lassen sich beide über die
Account-Konsole hinzufügen, und der Login-Flow akzeptiert beides als 2FA-Schritt.

### Eine Anmeldemethode wählen

Beide Methoden erfüllen den 2FA-Schritt. Du kannst einen Passkey, eine
Authenticator-App oder beides hinzufügen; die Abwägung:

**Passkey** (Standard) - eine an das Gerät gebundene Anmeldeinformation, die mit
Biometrie oder der Geräte-PIN entsperrt wird.

- **Vorteile**
  - Phishing-resistent - nichts zum Eintippen, Kopieren oder Leaken; das Geheimnis
    verlässt das Gerät nie.
  - Schnell - ein Fingertipp per Biometrie/PIN, keine Codes zum Ablesen.
  - Kein gemeinsames Geheimnis, das gespeichert oder abgetippt werden muss.
- **Nachteile**
  - **Keine Push-Benachrichtigungen und keine Web-Unterstützung** - der Passkey lebt
    auf dem Telefon, auf dem er eingerichtet wurde, die Anmeldung findet also dort
    statt: kein Desktop-/Web-Login und kein Push-to-Approve-Flow.
  - An dieses Gerät gebunden - geht es verloren, muss man sich neu registrieren
    (Wiederherstellung nötig).
  - Erfordert ein Gerät mit Biometrie-/WebAuthn-Unterstützung.

**Authenticator-App (TOTP)** - ein 6-stelliger, zeitbasierter Code aus einer App wie
Google Authenticator, Authy oder 1Password.

- **Vorteile**
  - Funktioniert überall, auch im Web, und über mehrere Geräte hinweg.
  - Portabel - der Seed kann gesichert oder auf andere Geräte übertragen werden.
  - Vertraut und weit verbreitet.
- **Nachteile**
  - Du tippst bei jeder Anmeldung einen 6-stelligen Code ein.
  - Beruht auf einem gemeinsamen Geheimnis (dem Seed), das phishbar ist und sicher
    aufbewahrt werden muss.
  - Codes schlagen fehl, wenn die Geräteuhr aus dem Takt gerät.

> Hinweis: Keycloak kann keinen einzigen Registrierungsbildschirm anzeigen, auf dem
> man zwischen Passkey **oder** OTP wählt - ein Passkey wird über seine Required
> Action registriert, OTP über das OTP-Formular. Da die Registrierung optional ist,
> fügen Nutzer über die Account-Konsole einfach hinzu, was ihnen lieber ist.

### Registrierung ist optional (keine erzwungene Migration)

Der MFA-Schritt ist `CONDITIONAL`: Ein Nutzer **mit** 2FA-Anmeldeinformation wird
danach gefragt; ein Nutzer **ohne** meldet sich mit seinem Passwort an (keine
erzwungene Registrierung). Da `webauthn-register-passwordless` / `CONFIGURE_TOTP`
**keine** Default Actions sind, gibt es beim Import dieses Realms auf eine bestehende
Nutzerbasis nichts, was nachträglich zugewiesen werden müsste.

Wenn du 2FA *zwingend vorschreiben* willst, markiere `webauthn-register-passwordless`
(und/oder `CONFIGURE_TOTP`) im Realm als **Default Action** - beachte aber, dass
Keycloak Default Actions auch auf **vermittelte IdP-Nutzer** anwendet, was Logins
über einen externen IdP (z. B. Pocket ID) durch einen redundanten
Registrierungsschritt blockiert. Genau deshalb ist es hier optional gehalten.

(Nutzer, die bereits OTP oder einen Passkey haben, bleiben unangetastet und nutzen
ihn weiter.)

## Das Realm bearbeiten

Realm-Änderungen werden in der **Admin-Konsole** vorgenommen und dann zurück ins
Repo gesichert, damit sie versioniert und ins nächste Image eingebacken werden.

1. Starte den Dev-Stack und öffne die Konsole - siehe
   [Entwicklungsumgebung](setup/development.md).
2. Nimm deine Änderungen im `schuly`-Realm über die UI vor.
3. Sichere das Realm zurück nach `realms/`:

   ```sh
   ./scripts/keycloak-export.sh        # bash / macOS / Linux
   ```

   Windows-Varianten:

   ```powershell
   .\scripts\keycloak-export.ps1       # PowerShell
   ```

   ```bat
   scripts\keycloak-export.bat         REM cmd.exe (wraps the .ps1)
   ```

Das Export-Skript stoppt den laufenden Container, führt Keycloaks `export`-Kommando
gegen den `realms/`-Ordner aus (gemountet unter `/export`, `--users skip`) und fährt
den Container anschliessend wieder hoch. Die aktualisierte
`realms/schuly-realm.json` ist das, was du committest.

> Der Export lässt Nutzer aus (`--users skip`) - die Realm-Datei enthält nur
> Konfiguration, keine Nutzerdaten.

Committe die neu generierte `realms/schuly-realm.json` über den gewohnten
[Contribution-Workflow](contributing.md).
