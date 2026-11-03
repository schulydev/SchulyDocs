# Eseguire senza dominio

Esegui Schuly sulla tua rete locale per testarla, ad esempio con un telefono sulla stessa rete Wi-Fi.
Senza dominio non c'è certificato, quindi il traffico è in HTTP non cifrato. Usa questa configurazione
solo per i test.

Segui [Self-hosting di Schuly](self-hosting.md) con le modifiche qui sotto. Gli esempi usano
`192.168.1.42` come indirizzo del tuo computer.

## 1. Imposta l'indirizzo

Salta il passo del DNS. In `.env`, imposta:

```sh
API_HOST=192.168.1.42
```

## 2. Servi HTTP non cifrato

Sostituisci il contenuto di `Caddyfile`:

```
http://{$API_HOST}:8080 {
	reverse_proxy backend:8080
}
```

In `compose.staging.yml`, sostituisci le `ports` del servizio `caddy`:

```yaml
    ports:
      - "8080:8080"
```

## 3. Correggi i link nelle mail

In `config/backend.env`, imposta:

```
Email__Smtp__PasswordResetLinkTemplate=http://${API_HOST}:8080/reset-password?token={token}
Email__Smtp__EmailVerificationLinkTemplate=http://${API_HOST}:8080/verify-email?token={token}
```

## 4. Avvia e verifica

```sh
docker compose -f compose.staging.yml up -d
curl http://192.168.1.42:8080/api/app/school-systems
```

Nell'app, inserisci `http://192.168.1.42:8080` come **Backend URL**.

## Risoluzione dei problemi

**Il telefono non raggiunge il server.** Su Windows, il firewall potrebbe bloccarlo. Consenti Docker
Desktop sulle reti private, oppure aggiungi una regola in entrata per la porta 8080.

**Un indirizzo `nip.io` o `sslip.io` non viene risolto.** Molti router domestici bloccano i nomi
pubblici che puntano a indirizzi privati. Usa invece l'indirizzo IP.

**L'indirizzo ha smesso di funzionare.** Il router potrebbe aver assegnato un nuovo indirizzo IP.
Aggiorna `API_HOST` e riavvia, oppure riserva l'indirizzo nel router.
