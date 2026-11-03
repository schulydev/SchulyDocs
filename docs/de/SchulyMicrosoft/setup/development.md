# Entwicklungsumgebung

Führe den Service lokal aus und starte seine Tests.

## Service ausführen

```sh
pip install -r requirements.txt
python asgi.py
```

Der Service lauscht auf `http://localhost:8010`. Die API-Referenz liegt unter `/docs`.

Oder führe ihn mit Docker aus:

```sh
docker build -t schulymicrosoft .
docker run -p 8010:8010 schulymicrosoft
```

## Tests ausführen

Die Tests sind vollständig gemockt und rufen Microsoft nicht auf.

```sh
python -m pytest tests -q
```

## Regeln für Änderungen

- Füge ausser der bestehenden Passwort-Anmeldung keine Endpunkte für Zugangsdaten hinzu.
- Halte Passwörter aus Logs, Anmelde-Jobs, Fehlern und Antworten heraus.
- Beschränke den Service auf einen Prozess. Füge keine Worker oder Replicas hinzu.
- Nutze nur die öffentlichen APIs von OutNote und Entrance.

Den Workflow findest du unter [Mitwirken](/de/contribute/).
