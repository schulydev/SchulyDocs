# SchulyMicrosoft-Dokumentation

SchulyMicrosoft ist ein zustandsloser FastAPI-Service. Er gibt Schuly Zugriff auf die eigenen
Microsoft-365-Daten einer lernenden Person: Mail, Kalender, OneDrive, OneNote und Teams. Das Schuly-Plugin
für Microsoft ist sein einziger Aufrufer.

Der Service braucht keine Azure-App und keine Admin-Zustimmung im Tenant, weil er über
[OutNote](https://github.com/PianoNic/OutNote) und [Entrance](https://github.com/PianoNic/Entrance)
Microsofts eigene, vorab zugelassene Clients nutzt.

- [Entwicklungsumgebung](setup/development.md)
- [API-Routen](https://github.com/schulydev/SchulyMicrosoft#how-sign-in-works), auch verfügbar unter `/docs` auf einem laufenden Service

## Wie die Anmeldung funktioniert

Das Ergebnis jeder Anmeldung ist ein Refresh-Token. Der Aufrufer speichert es und sendet es bei jedem
Lesezugriff im Header `X-MS-Refresh-Token`. Der Service gibt das rotierte Token im selben Header zurück
und speichert nichts.

| Ablauf | Genutzt von | So funktioniert es |
|---|---|---|
| Browser-Anmeldung | Dem Plugin in der Mobile App | Authorization Code mit PKCE auf Microsofts eigener Seite in einer WebView |
| Device Code | Anderen Aufrufern | Die lernende Person gibt auf Microsofts Seite einen kurzen Code ein, während der Aufrufer pollt |
| Passwort-Anmeldung | Der Web-App, die Microsofts Seite nicht einbinden kann | Der Service erhält das Passwort einmal, für diesen Aufruf |

### Passwort-Anmeldung

Der Service hält das Passwort nur für diesen Aufruf im Arbeitsspeicher. Er speichert, cacht und loggt es
nie und gibt es nie zurück. Wenn Microsoft MFA verlangt, pausiert die Anmeldung und bietet `push` oder `otp` an.

Nur das Schuly-Plugin kann diese Routen aufrufen:

- Jede Anfrage braucht das gemeinsame Secret in `X-Schuly-Service-Key`. Es muss `SCHULY_SERVICE_KEY` entsprechen. Ist diese Variable nicht gesetzt, antworten die Routen mit 503.
- Jede Anfrage braucht die ID des Schuly-Users in `X-Schuly-User-Id`. Ein Anmelde-Job gehört zu diesem User.

Anmelde-Jobs liegen bis zu 10 Minuten im Arbeitsspeicher. Der Service muss deshalb als genau ein Prozess
laufen. `asgi.py` setzt `workers=1`.

## Haftungsausschluss

Für Bildungs- und Forschungszwecke und nur für Konten, die dir gehören. Der Service führt eine echte
Microsoft-Anmeldung aus. Behandle deshalb jedes zurückgegebene Refresh-Token wie ein Passwort. Die
Wiederverwendung von Microsofts eigenen Clients ist kein offiziell unterstützter Integrationsweg, und ein
Tenant kann sie blockieren. Das Projekt ist nicht mit Microsoft verbunden und wird nicht von Microsoft
unterstützt.
