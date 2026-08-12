# Risoluzione dei problemi

Problemi comuni, le loro cause e come risolverli.

## La pagina di login sembra il Keycloak predefinito (non personalizzata)

Il jar del tema `schuly` non è caricato, oppure il realm non lo sta usando.

- Verifica che il `loginTheme` del realm sia `schuly` (`realms/schuly-realm.json`).
- Se hai modificato il codice del tema, ricostruisci l'immagine - il tema viene
  integrato al momento del build, non caricato a runtime:
  `docker compose -f compose.dev.yml up --build`. Vedi
  [Sviluppo del tema](theme-development.md).

## Redirect infiniti, "HTTPS required" o URL sbagliati nel browser

Keycloak non conosce il suo URL pubblico, oppure non si fida degli header del
proxy.

- Imposta `KC_HOSTNAME` sull'URL pubblico completo (es. `https://auth.schuly.dev`).
- Dietro un proxy che termina il TLS, imposta `KC_PROXY_HEADERS=xforwarded` e
  `KC_HTTP_ENABLED=true`, e assicurati che il proxy inoltri gli header
  `X-Forwarded-*`.
- Vedi [Self-hosting dello stack completo](setup/self-hosting.md).

## Le modifiche al JSON del realm non compaiono

Il realm viene importato solo al **primo** avvio; in seguito un realm esistente
resta invariato.

- **Sviluppo locale:** azzera il volume dati per reimportare -
  `docker compose -f compose.dev.yml down -v && docker compose -f compose.dev.yml up --build`.
- **Produzione:** il realm esiste già in Postgres; applica le modifiche nella
  console di amministrazione e salvale con lo script di export (vedi
  [Gestione del realm](realm-management.md)). Non aspettarti che il JSON incluso
  sovrascriva un realm attivo.

## L'health check fallisce / `/health` irraggiungibile

Health e metriche sono sulla **porta di management `9000`**, non sulla `8080`.

- Raggiungi `http://<host>:9000/health/ready` dall'interno della rete
  (intenzionalmente non è esposto tramite proxy a Internet).

## L'admin di bootstrap non riesce ad accedere

`KC_BOOTSTRAP_ADMIN_USERNAME` / `KC_BOOTSTRAP_ADMIN_PASSWORD` creano un account
solo al **primo** avvio su un database nuovo. Se il database aveva già un admin,
queste variabili non hanno effetto - usa l'admin esistente, oppure reimpostalo
tramite l'API REST di amministrazione.

## Errori di connessione al database all'avvio

- Verifica `KC_DB_URL`, `KC_DB_USERNAME`, `KC_DB_PASSWORD` e che Postgres sia
  raggiungibile e accetti connessioni (aspetta il suo healthcheck prima che
  Keycloak parta).
- L'immagine è costruita solo per Postgres - non sovrascrivere `KC_DB`.

## Ai nuovi utenti non vengono chieste la 2FA / la passkey

Il comportamento di registrazione della 2FA è definito dal flusso `browser-2fa` e
dalle azioni richieste - vedi la sezione 2FA in
[Gestione del realm](realm-management.md), inclusa la nota sulla migrazione per
gli utenti già esistenti.
