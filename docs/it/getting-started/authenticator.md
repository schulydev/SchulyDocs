---
sidebar_position: 6
title: Configura i codici a due fattori
---

# Configura i codici a due fattori

Schuly può generare i tuoi codici a due fattori, così non ti serve un'app di autenticazione separata.
Questa pagina usa come esempio un account scolastico Microsoft.

Ti serve un secondo schermo, perché il telefono su cui gira Schuly deve scansionare un codice QR. Con
un solo dispositivo, usa invece la chiave di configurazione: in Schuly, scegli **or enter manually**.

::: info Gli screenshot sono in tedesco
I passaggi mostrano le etichette tedesche con la traduzione italiana. Se il tuo account usa un'altra
lingua, cerca l'opzione nella stessa posizione.
:::

## 1. Apri le impostazioni di sicurezza

Vai su [myaccount.microsoft.com](https://myaccount.microsoft.com) e accedi.

![La pagina principale di Microsoft My Account](/img/totp/01-account-home.png)

Apri **Mein Konto** ("Il mio account"), poi **Sicherheitsinformationen** ("Informazioni di sicurezza").

![Informazioni di sicurezza nella barra laterale](/img/totp/02-security-info-nav.png)

## 2. Aggiungi un metodo di accesso

Scegli **Anmeldemethode hinzufügen** ("Aggiungi metodo di accesso").

![L'elenco dei metodi di accesso](/img/totp/03-add-sign-in-method.png)

Scegli **Microsoft Authenticator**.

![Scelta di Microsoft Authenticator](/img/totp/04-choose-authenticator.png)

## 3. Scegli un'altra app

Scegli **Andere App für die Authentifizierung einrichten** ("Usa un'altra app di autenticazione").

![Usa un'altra app di autenticazione](/img/totp/05-use-a-different-app.png)

Scegli **Weiter** ("Avanti").

![Configura l'account nell'app](/img/totp/06-set-up-account.png)

## 4. Scansiona il codice con Schuly

Microsoft mostra un codice QR.

![Il codice QR da scansionare](/img/totp/07-scan-qr-code.png)

Sul tuo telefono, in Schuly:

1. Tocca il tuo avatar in alto a sinistra, poi **Authenticator**.
2. Tocca **Add**, poi **Scan QR code**.
3. Inquadra il codice con la fotocamera.

Schuly salva la voce e mostra un codice a sei cifre.

## 5. Conferma il codice

Sul computer, scegli **Weiter** ("Avanti"), inserisci il codice di Schuly e conferma. Se il codice
scade prima, usa il successivo.

**Authenticator-App** ("App di autenticazione") compare ora tra i tuoi metodi di accesso.

## Usa i tuoi codici

Apri **Authenticator** in Schuly e tocca un codice per copiarlo.

::: warning I tuoi codici non hanno un backup
Il segreto resta sul tuo telefono e non viene sincronizzato, quindi lo perdi se perdi il telefono.
Configura un secondo metodo di accesso, come un numero di telefono, e conserva le opzioni di recupero
della tua scuola.
:::

## Risoluzione dei problemi

**La fotocamera non si apre.** Consenti a Schuly l'accesso alla fotocamera nelle impostazioni del tuo
telefono.

**Il codice QR non si scansiona.** Sulla pagina Microsoft, scegli **Impossibile scansionare il codice
QR?**. In Schuly, scegli **or enter manually** e incolla la chiave di configurazione.

**Il codice viene rifiutato.** I codici dipendono dall'orologio. Imposta il telefono sull'ora fornita
dalla rete.
