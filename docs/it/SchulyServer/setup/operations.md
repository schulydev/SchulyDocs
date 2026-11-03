# Gestire e aggiornare il server

Operazioni quotidiane per un server configurato con [Self-hosting di Schuly](self-hosting.md). Esegui
i comandi dalla cartella `deploy`.

## Backup

Tutti i dati sono in `deploy/data`. Fai il backup di questi elementi:

- `data/postgres`: account e dati scolastici
- `data/seaweedfs`: documenti e immagini del profilo
- `.env`: le chiavi. Senza di esse, parti del backup non sono leggibili.

## Aggiornamento

1. Fai il backup di `data/postgres`.
2. Imposta il nuovo `SCHULY_VERSION` in `.env`.
3. Esegui `docker compose -f compose.staging.yml up -d`.

Schuly aggiorna il suo database all'avvio. Per confermare la versione, apri
`https://<your domain>/api/app` e leggi il campo `version`.

## Eliminare tutti i dati

Ferma lo stack, poi elimina la cartella `data`:

```sh
docker compose -f compose.staging.yml down
rm -rf data
```

## Per quanto tempo vengono conservati i dati

Una volta al giorno, Schuly rimuove i dati scaduti:

| Dati | Rimossi dopo | Impostazione |
|---|---|---|
| Dati scolastici di uno studente che ha lasciato la scuola | 6 mesi dopo la data di uscita | `Retention__MonthsAfterLeave` |
| Dati Schuly di un account inattivo | 12 mesi senza richieste | `Retention__MonthsInactive` |

Modificali in `config/backend.env`, oppure disattiva la pulizia con `Retention__Enabled`. L'account di
accesso resta, quindi chi ha dati scaduti può accedere e sincronizzare di nuovo.

Quando gli utenti eliminano il loro account, Schuly cancella subito i loro dati scolastici, i
documenti e i dati di accesso.

## Passare da Keycloak

I server meno recenti usavano un container Keycloak separato. Le password non si possono trasferire,
quindi gli utenti esistenti devono registrarsi di nuovo o reimpostare la password.

1. Aggiungi a `.env` le nuove chiavi di `.env.example`.
2. Rimuovi `AUTH_HOST`, `KEYCLOAK_VERSION` e tutte le variabili `KC_*`.
3. Prendi dal repository gli attuali `compose.staging.yml`, `Caddyfile` e la cartella `config`.
