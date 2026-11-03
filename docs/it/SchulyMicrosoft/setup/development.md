# Setup di sviluppo

Esegui il servizio in locale ed esegui i suoi test.

## Esegui il servizio

```sh
pip install -r requirements.txt
python asgi.py
```

Il servizio è in ascolto su `http://localhost:8010`. Il riferimento API è su `/docs`.

Oppure eseguilo con Docker:

```sh
docker build -t schulymicrosoft .
docker run -p 8010:8010 schulymicrosoft
```

## Esegui i test

I test usano solo mock e non fanno chiamate a Microsoft.

```sh
python -m pytest tests -q
```

## Regole per le modifiche

- Non aggiungere endpoint per le credenziali oltre all'accesso con password esistente.
- Tieni le password fuori da log, job di accesso, errori e risposte.
- Mantieni il servizio a un solo processo. Non aggiungere worker o repliche.
- Usa solo le API pubbliche di OutNote ed Entrance.

Per il flusso di lavoro, vedi [Contribuisci](/it/contribute/).
