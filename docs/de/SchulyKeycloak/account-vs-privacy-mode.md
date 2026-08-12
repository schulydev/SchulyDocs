# Account- vs. Privatmodus

Schuly lässt sich auf zwei Arten nutzen. Diese Seite erklärt die Vor- und Nachteile,
damit du entscheiden kannst, wie du dich anmeldest.

## Account-Modus (empfohlen)

Melde dich mit einem **Schuly-Account** an - der Cloud-Identität, die auf diesem
Keycloak basiert. Dein Profil und deine Daten liegen bei Schuly und begleiten dich
über alle Geräte hinweg.

- **Vorteile**
  - **Push-Benachrichtigungen** - werde über Änderungen informiert (Stundenplan, Noten, Nachrichten).
  - **Web-Unterstützung** - nutze Schuly im Browser, nicht nur in der App.
  - **Geräteübergreifende Synchronisation** - melde dich überall an und mach genau dort weiter, wo du aufgehört hast.
  - Unterstützt 2FA (einen Passkey oder eine Authenticator-App) - angeboten, nicht erzwungen - siehe
    [Realm-Verwaltung](realm-management.md).
- **Nachteile**
  - Erfordert das Erstellen eines Accounts und die Anmeldung.
  - Deine Daten liegen in der Schuly-Cloud (gesichert, aber nicht rein lokal).
  - Hängt davon ab, dass der Schuly-Identitätsdienst erreichbar ist.

## Privatmodus

Nutze die App **ohne Schuly-Account** - sie spricht direkt mit deinem Schulportal und
behält deine Zugangsdaten und Daten auf dem Gerät.

- **Vorteile**
  - Maximale Privatsphäre - nichts wird in der Schuly-Cloud gespeichert.
  - Kein Account nötig; die Daten bleiben auf deinem Gerät.
- **Nachteile**
  - **Keine Push-Benachrichtigungen und keine Web-Unterstützung** - beides setzt einen
    Schuly-Account voraus, im Privatmodus erhältst du also keine Benachrichtigungen
    und kannst die App nur auf diesem Gerät nutzen.
  - Keine geräteübergreifende Synchronisation - jedes Gerät wird unabhängig eingerichtet.

## Was soll ich wählen?

Wähle den **Account-Modus**, wenn du Benachrichtigungen, die Web-App und deine über
alle Geräte synchronisierten Daten möchtest - das ist die alltägliche Erfahrung für
die meisten Nutzer. Wähle den **Privatmodus**, wenn du lieber alles auf deinem Gerät
behältst und weder Benachrichtigungen noch die Web-App oder Synchronisation brauchst.
